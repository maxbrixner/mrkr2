/* -------------------------------------------------------------------------- */

import { ResizablePanes } from './resizable_panes.js';
import { DocumentViewer } from './document_viewer.js';
import { TabContainer } from './tab_container.js';
import { LabelFragment } from './label_fragment.js';
import { LabelButton } from './label_button.js';
import { StyledButton } from './styled_button.js';

/* -------------------------------------------------------------------------- */

interface LabelMakerAttributes {
    projectUrl?: string,
    documentUrl?: string,
}

/* -------------------------------------------------------------------------- */

interface LabelSchema {
    name: string
}

/* -------------------------------------------------------------------------- */

interface TextLabelSchema extends LabelSchema {
    start: number
    end: number
}

/* -------------------------------------------------------------------------- */

interface PositionSchema extends LabelSchema {
    left: number
    top: number
    width: number
    height: number
}

/* -------------------------------------------------------------------------- */

interface BlockLabelDataSchema {
    id: string
    labels: LabelSchema[]
    text_labels: TextLabelSchema[]
    position: PositionSchema
    content: string
}

/* -------------------------------------------------------------------------- */

interface PageLabelDataSchema {
    id: string
    page: number
    labels: LabelSchema[]
    blocks: BlockLabelDataSchema[]
}

/* -------------------------------------------------------------------------- */

interface DocumentLabelDataSchema {
    labels: LabelSchema[]
    pages: PageLabelDataSchema[]
}

/* -------------------------------------------------------------------------- */

interface LabelDefinitionSchema {
    type: string
    targets: string[]
    name: string
    color: string
}

/* -------------------------------------------------------------------------- */

class LabelMaker extends HTMLElement implements LabelMakerAttributes {
    public projectUrl?: string = undefined;
    public documentUrl?: string = undefined;
    public documentContentUrl?: string = undefined;
    public documentLabeldataUrl?: string = undefined;
    public projectLabelDefinitionUrl?: string = undefined;
    public showPages?: 'instantly' | 'first-loaded' | 'all-loaded' = undefined;
    private _resizablePanes: ResizablePanes = new ResizablePanes()
    private _documentViewer: DocumentViewer = new DocumentViewer();
    private _labelContainer: HTMLDivElement = document.createElement('div');
    private _labelControls: HTMLDivElement = document.createElement('div');
    private _submitButton: StyledButton = new StyledButton();
    private _tabContainer: TabContainer = new TabContainer();
    private _documentTab: HTMLDivElement = document.createElement('div');
    private _pageTab: HTMLDivElement = document.createElement('div');
    private _blockTab: HTMLDivElement = document.createElement('div');
    private _labelDefinitions: LabelDefinitionSchema[] | null = null;
    private _labeldata: DocumentLabelDataSchema | null = null;

    /**
     * Creates an instance of LabelMaker.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    /**
     * Returns an array of attribute names that this component observes.
     */
    static get observedAttributes() {
        return ['document-metadata-url', 'document-content-url', 'document-labeldata-url',
            'project-label-definition-url', 'show-pages'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'document-metadata-url') {
            this.documentMetadataUrl = newValue || undefined;
            if (this.documentMetadataUrl)
                this._documentViewer.setAttribute('metadata-url',
                    this.documentMetadataUrl);
        } else if (propertyName === 'document-content-url') {
            this.documentContentUrl = newValue || undefined;
            if (this.documentContentUrl)
                this._documentViewer.setAttribute('content-url',
                    this.documentContentUrl);
        } else if (propertyName === 'document-labeldata-url') {
            this.documentLabeldataUrl = newValue || undefined;
        } else if (propertyName === 'project-label-definition-url') {
            this.projectLabelDefinitionUrl = newValue || undefined;
        } else if (propertyName === 'show-pages') {
            this.showPages = newValue as 'instantly' | 'first-loaded' | 'all-loaded';
            if (this.showPages)
                this._documentViewer.setAttribute('show-pages',
                    this.showPages);
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        this._addEventListeners();
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        this._removeEventListeners();
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: grid;
                overflow: hidden;
                grid-template-columns: 1fr;
                grid-template-rows: 1fr;
            }
            .tab-content {
                box-sizing: border-box;
                display: grid;
                grid-auto-rows: min-content;
                overflow-y: auto;
                padding: 1rem;
                gap: 1rem;
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                scrollbar-color: var(--label-viewer-scrollbar-color, inherit);
                height: 100%;
            }
            .label-container {
                display: grid;
                grid-template-rows: 1fr auto;
                overflow: hidden;
            }
            .label-controls {
                display: flex;
                justify-content: flex-end;
                padding: 0.5rem;
                border-top: 1px solid var(--label-fragment-border-color);
                background-color: var(--label-fragment-title-background-color);
            }
        `;

        this.shadowRoot.appendChild(style);

        this._resizablePanes.setAttribute('orientation', 'vertical');
        this._resizablePanes.setAttribute('minsize', '400px');
        this._resizablePanes.setAttribute('startsize', '50%');

        this._documentViewer.slot = 'first';
        this._resizablePanes.appendChild(this._documentViewer);

        this._labelContainer.slot = 'second';
        this._labelContainer.className = 'label-container';
        this._resizablePanes.appendChild(this._labelContainer);

        this._labelContainer.appendChild(this._tabContainer);

        this._submitButton.setAttribute('type', 'button');
        this._submitButton.setAttribute('name', 'submit-labels');
        this._submitButton.textContent = 'Submit';
        this._labelControls.className = 'label-controls';
        this._labelControls.appendChild(this._submitButton);
        this._labelContainer.appendChild(this._labelControls);

        this._documentTab.slot = 'Document';
        this._documentTab.classList.add("tab-content", "tab-document", "loading");
        this._tabContainer.appendChild(this._documentTab);

        this._pageTab.slot = 'Page';
        this._pageTab.classList.add("tab-content", "tab-page", "loading");
        this._tabContainer.appendChild(this._pageTab);

        this._blockTab.slot = 'Block';
        this._blockTab.classList.add("tab-content", "tab-block", "loading");
        this._tabContainer.appendChild(this._blockTab);

        this.shadowRoot.appendChild(this._resizablePanes);
    }

    /**
     * Adds event listeners to the component.
     */
    private _addEventListeners() {
        this.shadowRoot?.addEventListener(
            'pages-created',
            this._onPagesCreated as EventListener
        );

        this.shadowRoot?.addEventListener(
            'label-button-click',
            this._onLabelButtonClick as EventListener
        );

        this._submitButton?.addEventListener(
            'click',
            this._onSubmitButtonClick as EventListener
        );

    }

    /**
     * Removes event listeners from the component.
     */
    private _removeEventListeners() {
        this.shadowRoot?.removeEventListener(
            'pages-created',
            this._onPagesCreated as EventListener
        );

        this.shadowRoot?.removeEventListener(
            'label-button-click',
            this._onLabelButtonClick as EventListener
        );

        this._submitButton?.removeEventListener(
            'click',
            this._onSubmitButtonClick as EventListener
        );
    }

    /**
     * Handles the 'pages-created' event. This event is triggered when
     * the document viewer has initially created the pages from the metadata
     * but has not yet loaded the page images. From this point, it is possible
     * to add the highlights to the pages.
     */
    private _onPagesCreated = (event: CustomEvent) => {
        this._queryLabelDefinitions().then(definitions => {
            if (!definitions) {
                // todo: handle this by adding text to show the user
                return;
            }
            this._labelDefinitions = definitions;

            this._addDocumentLabelers();
            this._addPageLabelers();
            this._addBlockLabelers();
        }).catch(error => {
            // todo: handle this by showing the user
            throw new Error(`Error fetching label definitions: ${error.message}`);
        });

        this._queryLabeldata().then(data => {
            if (!data) {
                // todo: handle this by adding text to show the user
                return;
            }
            this._labeldata = data;

            this._addDocumentLabelers();
            this._addPageLabelers();
            this._addBlockLabelers();
        }).catch(error => {
            // todo: handle this by showing the user
            throw new Error(`Error fetching label data: ${error.message}`);
        });
    };

    /**
     * Handles the 'label-button-click' event. This event is triggered when
     * the user clicks on a label button in the label fragment.
     */
    private _onLabelButtonClick = (event: CustomEvent) => {
        if (!this._labelDefinitions || !this._labeldata) {
            return;
        }

        const detail = event.detail;

        console.log(detail);

        var list: LabelSchema[] | null = null;

        if (detail.targetType === 'document') {
            list = this._labeldata?.labels || null;
        } else if (detail.targetType === 'page') {
            list = this._labeldata.pages.find(
                page => page.page === parseInt(detail.target)
            )?.labels || null;
        } else if (detail.targetType === 'block' && detail.type !== 'text') {
            for (const page of this._labeldata.pages) {
                list = page.blocks.find(
                    block => block.id === detail.target
                )?.labels || null;
                if (list) {
                    break; // Exit loop if found
                }
            }
        } else if (detail.type === 'text') {
            for (const page of this._labeldata.pages) {
                list = page.blocks.find(
                    block => block.id === detail.target
                )?.text_labels || null;
                if (list) {
                    break; // Exit loop if found
                }
            }
        } else {
            list = null; // Invalid target type
            return;
        }

        if (list === null) {
            console.error(`Labels not found for target type: ${detail.targetType}`);
            return;
        }

        if (detail.active) {
            if (detail.type === 'classification_exclusive') {
                list.length = 0;
                list.push({ 'name': detail.name });
                detail.button.setAttribute('active', 'true');
                const siblings = detail.button.parentElement?.children;
                for (const sibling of siblings || []) {
                    if (sibling instanceof LabelButton &&
                        sibling !== detail.button) {
                        sibling.setAttribute('active', 'false');
                    }
                }
            } else if (detail.type === 'classification') {
                // Add the label to the list if it doesn't already exist
                if (!list.some(label => label.name === detail.name)) {
                    list.push(
                        { 'name': detail.name }
                    );
                }
                detail.button.setAttribute('active', 'true');
            } else if (detail.type === 'text') {
                // For text labels, we don't add them to the list, but handle them separately
                // This is a placeholder for future text label handling logic
                detail.button.setAttribute('active', 'true');
                const siblings = detail.button.parentElement?.children;
                for (const sibling of siblings || []) {
                    if (sibling instanceof LabelButton &&
                        sibling !== detail.button) {
                        sibling.setAttribute('active', 'false');
                    }
                }
            }
        } else if (!detail.active) {
            let i = 0;
            while (i < list.length) {
                if (list[i].name === detail.name) {
                    list.splice(i, 1);
                } else {
                    i++;
                }
            }
            detail.button.setAttribute('active', 'false');
        }

        console.log("Label data updated", this._labeldata);
    }

    /**
     * Handles the 'label-button-click' event. This event is triggered when
     * the user clicks on a label button in the label fragment.
     */
    private _onSubmitButtonClick = (event: CustomEvent) => {
        if (!this._labelDefinitions || !this._labeldata) {
            return;
        }

        this._submitLabeldata().then(result => {
            if (!result) {
                // todo: handle this by adding text to show the user
                return;
            }

            console.log("Label data submitted successfully.");
        }).catch(error => {
            // todo: handle this by showing the user
            throw new Error(`Error fetching label data: ${error.message}`);
        });
    }

    /**
     * Handles the 'label-button-click' event. This event is triggered when
     * the user clicks on a label button in the label fragment.
     */
    private _onPageClick(scrollElement: HTMLElement) {
        return (event: CustomEvent) => {
            console.log("Page clicked", event);
            this._tabContainer.switchToTab("Page");
            scrollElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            scrollElement.classList.remove('pulsing');
            scrollElement.offsetHeight;
            scrollElement.classList.add('pulsing');

            scrollElement.addEventListener('animationend', () => {
                scrollElement.classList.remove('pulsing');
            }, { once: true }); // The { once: true } option ensures the listener is removed after it fires

            // stop the event from propagating to the document viewer
            event.stopPropagation();
            event.preventDefault();
        }
    }

    /**
     * Handles the 'highlight-click' event. This event is triggered when
     * the user clicks on a highlight in the document viewer.
     */
    private _onHighlightClick(scrollElement: HTMLElement) {
        return (event: CustomEvent) => {
            console.log("Block clicked", scrollElement);
            this._tabContainer.switchToTab("Block");
            scrollElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            scrollElement.classList.remove('pulsing');
            scrollElement.offsetHeight;
            scrollElement.classList.add('pulsing');

            scrollElement.addEventListener('animationend', () => {
                scrollElement.classList.remove('pulsing');
            }, { once: true }); // The { once: true } option ensures the listener is removed after it fires

            // stop the event from propagating to the document viewer
            event.stopPropagation();
            event.preventDefault();
        }
    }

    /**
     * Adds labelers to the document tab.
     */
    private _addDocumentLabelers() {
        if (!this._labelDefinitions || !this._labeldata) {
            return;
        }
        this._documentTab.classList.remove("loading");
        this._documentTab.innerHTML = ''; // Clear previous content

        const fragment = new LabelFragment();
        fragment.setAttribute('heading', 'Document');

        for (const definition of this._labelDefinitions) {
            if (!definition.targets.includes('document')) {
                continue;
            }

            const active = this._labeldata.labels.some(
                label => label.name === definition.name
            );

            fragment.addLabelButton(
                definition.name,
                definition.color,
                definition.type,
                active,
                "document",
                ""
            );
        }

        this._documentTab.appendChild(fragment);
    }

    /**
     * Adds labelers to the page tab.
     */
    private _addPageLabelers() {
        if (!this._labelDefinitions || !this._labeldata) {
            return;
        }
        this._pageTab.classList.remove("loading");
        this._pageTab.innerHTML = ''; // Clear previous content

        for (const page of this._labeldata.pages) {

            const fragment = new LabelFragment();
            fragment.setAttribute('heading', `Page ${page.page}`);

            for (const definition of this._labelDefinitions) {
                if (!definition.targets.includes('page')) {
                    continue;
                }

                const active = page.labels.some(
                    label => label.name === definition.name
                );

                fragment.addLabelButton(
                    definition.name,
                    definition.color,
                    definition.type,
                    active,
                    "page",
                    page.page.toString()
                );
            }

            fragment.addEventListener(
                'focusin',
                this._onFocusInPageFragment(page.page) as EventListener
            )

            this._documentViewer.addPageEventListener(
                page.page,
                'click',
                this._onPageClick(fragment) as EventListener,
            )

            this._pageTab.appendChild(fragment);

        }
    }

    /**
     * Adds labelers to the block tab.
     */
    private _addBlockLabelers() {
        if (!this._labelDefinitions || !this._labeldata) {
            return;
        }
        this._blockTab.classList.remove("loading");
        this._blockTab.innerHTML = ''; // Clear previous content

        for (const page of this._labeldata.pages) {

            for (const block of page.blocks) {

                const fragment = new LabelFragment();
                fragment.setAttribute('heading', `Block`);

                for (const definition of this._labelDefinitions) {
                    if (!definition.targets.includes('block')) {
                        continue;
                    }
                    if (definition.type === 'text') {
                        fragment.add_text_label_button(
                            definition.name,
                            definition.color,
                            definition.type,
                            "block",
                            block.id
                        );
                    } else {

                        const active = block.labels.some(
                            label => label.name === definition.name
                        );

                        fragment.addLabelButton(
                            definition.name,
                            definition.color,
                            definition.type,
                            active,
                            "block",
                            block.id
                        );
                    }

                }

                fragment.add_text(block.content, block.text_labels);

                const highlight = this._documentViewer.addHighlight(
                    page.page,
                    block.position.left,
                    block.position.top,
                    block.position.width,
                    block.position.height,
                    block.id,
                    { 'click': this._onHighlightClick(fragment) as EventListener }
                )

                if (highlight) {
                    fragment.addEventListener(
                        'focusin',
                        this._onFocusInBlockFragment(highlight) as EventListener
                    )
                }

                document.addEventListener(
                    'selectionchange',
                    this._onSelectionChange(fragment, block) as EventListener
                );

                this._blockTab.appendChild(fragment);

            }

        }
    }


    private _onSelectionChange(fragment: LabelFragment, block: BlockLabelDataSchema) {
        return (event: Event) => {
            const selection = (fragment.shadowRoot as any)?.getSelection(); // Warning: this only works in Chrome-Browsers
            if (!selection || selection.rangeCount === 0) return;
            const range = selection.getRangeAt(0);
            console.log(selection, range);
            console.log(range.startOffset, range.endOffset);

            if (range.startContainer === range.endContainer &&
                range.startContainer.nodeType === Node.TEXT_NODE) {
                const startOffset = range.startOffset;
                const endOffset = range.endOffset;

                if (startOffset === endOffset) {
                    // No selection, do nothing
                    return;
                }

                const textLabel: TextLabelSchema = {
                    name: 'text',
                    content_start: startOffset,
                    content_end: endOffset
                };

                // Check if the text label already exists
                const existingTextLabel = block.text_labels.find(
                    label => label.content_start === startOffset &&
                        label.content_end === endOffset
                );



                /*if (!existingTextLabel) {
                    block.text_labels.push(textLabel);
                }*/
            }
        }
    }

    private _onFocusInPageFragment(page: number) {
        return (event: Event) => {
            this._documentViewer.scrollToPage(page);
        }
    }

    private _onFocusInBlockFragment(block: HTMLElement) {
        return (event: Event) => {
            block.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            block.classList.remove('pulsing');
            block.offsetHeight;
            block.classList.add('pulsing');

            block.addEventListener('animationend', () => {
                block.classList.remove('pulsing');
            }, { once: true }); // The { once: true } option ensures the listener is removed after it fires
        }
    }




    /**
     * Fetches label data from the specified URL.
     */
    private async _queryLabeldata(): Promise<DocumentLabelDataSchema | null> {
        if (!this.documentLabeldataUrl) {
            throw new Error(`Label data URL is not set`);
        }
        const response = await fetch(this.documentLabeldataUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: DocumentLabelDataSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch label data`);
        }

        return content;
    }

    /**
     * Fetches label definitions from the specified URL.
     */
    private async _queryLabelDefinitions(): Promise<LabelDefinitionSchema[] | null> {
        if (!this.projectLabelDefinitionUrl) {
            throw new Error(`Label definition URL is not set`);
        }
        const response = await fetch(this.projectLabelDefinitionUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: LabelDefinitionSchema[] | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch label definitions`);
        }

        return content;
    }

    /**
     * Updates label data using the label data URL.
     */
    private async _submitLabeldata(): Promise<boolean> {
        if (!this.documentLabeldataUrl) {
            throw new Error(`Label data URL is not set`);
        }
        const response = await fetch(
            this.documentLabeldataUrl,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this._labeldata)
            }
        );
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: DocumentLabelDataSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to submit label data`);
        }

        return (true);
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('label-maker', LabelMaker);

/* -------------------------------------------------------------------------- */