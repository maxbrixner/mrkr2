/* -------------------------------------------------------------------------- */

import { ResizablePanes } from './resizable_panes.js';
import { DocumentViewer, PagesCreatedEvent, PageClickedEvent, HighlightClickedEvent } from './document_viewer.js';
import { TabContainer } from './tab_container.js';
import { ClassificationLabeler } from './classification_labeler.js';
import { TextLabeler } from './text_labeler.js';
import { LabelButton } from './label_button.js';
import { combineHexColors, getRelativeLuminance, hexToRgbA, hexToRgb } from './color_helpers.js';

/* -------------------------------------------------------------------------- */

interface LabelMakerAttributes {
    projectUrl?: string,
    documentUrl?: string,
    imageUrl?: string,
    updateUrl?: string,
}

/* -------------------------------------------------------------------------- */

interface LabelSchema {
    id?: string // only for internal pruposes, not present in database
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

interface PagePropertiesSchema {
    aspect_ratio: number
    format: string
    height: number
    mode: string
    page: number
    width: number
}

/* -------------------------------------------------------------------------- */

interface BlockLabelDataSchema {
    id: string
    position: PositionSchema
    labels: (LabelSchema | TextLabelSchema)[]
    content: string
}

/* -------------------------------------------------------------------------- */

interface PageLabelDataSchema {
    id: string
    page: number
    properties: PagePropertiesSchema
    labels: LabelSchema[]
    blocks: BlockLabelDataSchema[]
}

/* -------------------------------------------------------------------------- */

interface DocumentLabelDataSchema {
    labels: LabelSchema[]
    pages: PageLabelDataSchema[]
}

/* -------------------------------------------------------------------------- */

interface DocumentSchema {
    id: number
    created: string
    updated: string
    path: string
    data: DocumentLabelDataSchema
}

/* -------------------------------------------------------------------------- */

interface LabelDefinitionSchema {
    type: "classification_multiple" | "classification_single" | "text"
    target: "document" | "page" | "block"
    name: string
    color: string
}

/* -------------------------------------------------------------------------- */

interface ProjectConfigSchema {
    label_definitions: LabelDefinitionSchema[]
    file_provider: any
    ocr_provider: any
}

/* -------------------------------------------------------------------------- */

interface ProjectSchema {
    id: number
    name: string
    created: string
    updated: string
    config: ProjectConfigSchema
}

/* -------------------------------------------------------------------------- */

interface ColoredSpan {
    start: number;
    end: number;
    backgroundColor: string;
    color: string;
}

/* -------------------------------------------------------------------------- */

class LabelMaker extends HTMLElement implements LabelMakerAttributes {
    public projectUrl?: string = undefined;
    public documentUrl?: string = undefined;
    public imageUrl?: string = undefined
    public updateUrl?: string = undefined;

    private _document?: DocumentSchema = undefined;
    private _project?: ProjectSchema = undefined;

    private _resizablePanes = new ResizablePanes();
    private _documentViewer = new DocumentViewer();
    private _tabContainer = new TabContainer();

    private _documentTab?: HTMLElement = undefined;
    private _pageTab?: HTMLElement = undefined;
    private _blockTab?: HTMLElement = undefined;

    private _pageLabelers: { [page: number]: ClassificationLabeler } = {};

    private _submitButton?: HTMLElement = undefined;

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
        return ['document-url', 'project-url', 'image-url', 'update-url'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'document-url') {
            this.documentUrl = newValue || undefined;
        } else if (propertyName === 'project-url') {
            this.projectUrl = newValue || undefined;
        } else if (propertyName === 'image-url') {
            this.imageUrl = newValue || undefined;
            if (this.imageUrl)
                this._documentViewer.setAttribute("url", this.imageUrl);
        } else if (propertyName === 'update-url') {
            this.updateUrl = newValue || undefined;
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        this._addEventListeners();
        this._submitButton = document.getElementById('submit_labels') || undefined;

        if (!this._submitButton) {
            throw new Error("Submit button not found in the document.");
        }

        this._submitButton.addEventListener('click', this._onSubmitButtonClick());
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
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                height: 100%;
                overflow: hidden;
                width: 100%;
            }

            .tab-content {
                box-sizing: border-box;
                display: grid;
                gap: 1rem;
                grid-auto-rows: min-content;
                height: 100%;
                overflow-y: auto;
                padding: 1rem;
                scrollbar-color: var(--label-maker-scrollbar-color, inherit);
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                width: 100%;
            }

            .pulsing {
                animation: pulse .8s ease-in-out 0s 2 alternate;
            }

            @keyframes pulse {
                0% {
                    outline: 0px solid transparent;
                }

                50% {
                    outline: 3px solid var(--document-viewer-highlight-focus-outline-color);               
                }

                100% {
                    outline: 0px solid transparent;
                }
            }
        `;

        this.shadowRoot.appendChild(style);

        this._resizablePanes.setAttribute('orientation', 'vertical');
        this._resizablePanes.setAttribute('minsize', '400px');
        this._resizablePanes.setAttribute('startsize', '50%');

        this._documentViewer.slot = 'first';
        this._resizablePanes.appendChild(this._documentViewer);

        this._tabContainer.slot = 'second';
        this._resizablePanes.appendChild(this._tabContainer);

        this.shadowRoot.appendChild(this._resizablePanes);
    }

    /**
     * Adds event listeners to the component.
     */
    private _addEventListeners() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this.shadowRoot.addEventListener('pages-created', this._onPagesCreated.bind(this));
        this.shadowRoot.addEventListener('page-clicked', this._onPageClicked.bind(this));
    }

    /**
     * Remove event listeners to the component.
     */
    private _removeEventListeners() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this.shadowRoot.removeEventListener('pages-created', this._onPagesCreated.bind(this));
        this.shadowRoot.removeEventListener('page-clicked', this._onPageClicked.bind(this));
    }

    /**
     * Event listener for 'pages-created' events.
     */
    private _onPagesCreated(event: Event) {
        event.stopPropagation();
        const customEvent = event as CustomEvent<PagesCreatedEvent>;
        this._queryContent(this._populateContent.bind(this));
    }

    /**
     * Event listener for 'page-clicked' events.
     */
    private _onPageClicked(event: Event) {
        event.stopPropagation();
        const customEvent = event as CustomEvent<PageClickedEvent>;
        this._tabContainer.switchToTab("Page");
        const associatedLabeler = this._pageLabelers[customEvent.detail.page];
        if (!associatedLabeler) {
            throw new Error(`Page labeler for page ${customEvent.detail.page} not found.`);
        }
        associatedLabeler.scrollIntoView({ behavior: 'smooth', block: 'center' });
        associatedLabeler.classList.add('pulsing');
        associatedLabeler.addEventListener('animationend', () => {
            associatedLabeler.classList.remove('pulsing');
        }, { once: true });
    }

    /**
     * Queries the document and project content from the specified URLs.
     */
    private _queryContent(callback: CallableFunction) {
        this._queryDocument()
            .then((document: DocumentSchema) => {
                this._document = document;
                if (this._document && this._project) {
                    callback();
                }
            })
            .catch((error: Error) => {
                console.error(`Error fetching document: ${error.message}`);
            });

        this._queryProject()
            .then((project: ProjectSchema) => {
                this._project = project;
                if (this._document && this._project) {
                    callback();
                }
            })
            .catch((error: Error) => {
                console.error(`Error fetching project: ${error.message}`);
            });
    }

    /**
     * Populates the content of the document viewer with highlights based on 
     * the document data.
     */
    private _populateContent() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }

        this._addTabsToTabContainer();
        this._submitButton?.removeAttribute('disabled');
    }

    /**
     * Adds tabs to the tab container based on the label definitions in the project.
     */
    private _addTabsToTabContainer() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }

        if (this._project.config.label_definitions.some(
            (definition) => definition.target === 'document')) {
            this._documentTab = document.createElement('div');
            this._documentTab.slot = 'Document';
            this._documentTab.classList.add("tab-content");
            this._addDocumentLabelers();
            this._tabContainer.appendChild(this._documentTab);
        }

        if (this._project.config.label_definitions.some(
            (definition) => definition.target === 'page')) {
            this._pageTab = document.createElement('div');
            this._pageTab.slot = 'Page';
            this._pageTab.classList.add("tab-content");
            this._addPageLabelers();
            this._tabContainer.appendChild(this._pageTab);
        }

        if (this._project.config.label_definitions.some(
            (definition) => definition.target === 'block')) {
            this._blockTab = document.createElement('div');
            this._blockTab.slot = 'Block';
            this._blockTab.classList.add("tab-content");
            this._addBlockLabelers();
            this._tabContainer.appendChild(this._blockTab);
        }

        this._tabContainer.updateTabs();
    }

    private _addDocumentLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        if (!this._documentTab) {
            throw new Error("Document tab is not initialized.");
        }

        const classificationLabeler = new ClassificationLabeler();
        classificationLabeler.setAttribute('heading', 'Document');
        classificationLabeler.addCheckButton();
        this._documentTab.appendChild(classificationLabeler);

        const labelDefinitions = this._project.config.label_definitions;

        for (const definition of labelDefinitions) {
            if (definition.target !== 'document')
                continue;

            if (definition.type === 'text') {
                continue; // Text labels are not permitted for documents
            }


            const labelStatus = this._document.data.labels.some(label => label.name === definition.name);

            const labelButton = classificationLabeler.addClassificationButton(
                definition.name,
                definition.color,
                definition.type,
                labelStatus,
            )
            labelButton.addEventListener('click', this._onClassificationLabelButtonClick(
                this._document.data.labels,
                definition.name,
                definition.type as "classification_multiple" | "classification_single"
            ));
        }
    }

    private _addPageLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        if (!this._pageTab) {
            throw new Error("Page tab is not initialized.");
        }

        for (const page of this._document.data.pages) {
            const classificationLabeler = new ClassificationLabeler();
            classificationLabeler.setAttribute('heading', `Page ${page.page}`);
            this._pageLabelers[page.page] = classificationLabeler;
            this._pageTab.appendChild(classificationLabeler);


            const viewButton = classificationLabeler.addViewButton();
            viewButton.addEventListener('click', this._onPageViewButtonClick(page.page));


            const checkButton = classificationLabeler.addCheckButton();

            const labelDefinitions = this._project.config.label_definitions;

            for (const definition of labelDefinitions) {
                if (definition.target !== 'page')
                    continue;

                if (definition.type === 'text') {
                    continue; // Text labels are not permitted for pages
                }

                const labelStatus = page.labels.some(label => label.name === definition.name);

                const labelButton = classificationLabeler.addClassificationButton(
                    definition.name,
                    definition.color,
                    definition.type,
                    labelStatus
                )

                labelButton.addEventListener('click', this._onClassificationLabelButtonClick(
                    page.labels,
                    definition.name,
                    definition.type as "classification_multiple" | "classification_single"
                ));
            }
        }
    }

    private _addBlockLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }

        const labelDefinitions = this._project.config.label_definitions;


        for (const page of this._document.data.pages) {
            for (const block of page.blocks) {
                const highlight = this._documentViewer.addHighlight(
                    page.page,
                    block.position.left,
                    block.position.top,
                    block.position.width,
                    block.position.height,
                    `Block ${block.id}`,
                    block.id
                );

                const textLabeler = new TextLabeler();
                textLabeler.setAttribute('heading', `Block`);
                this._blockTab?.appendChild(textLabeler);



                const editButton = textLabeler.addEditButton();
                editButton.addEventListener('click', this._onBlockEditButtonClick(textLabeler, block, labelDefinitions));

                const viewButton = textLabeler.addViewButton();
                viewButton.addEventListener('click', this._onBlockViewButtonClick(highlight));

                const checkButton = textLabeler.addCheckButton();


                textLabeler.addText(this._formatBlockText(block, labelDefinitions));

                highlight.addEventListener('click', this._onHighlightClick("Block", textLabeler));

                this._addTextLabelsToList(textLabeler, block, labelDefinitions);

                for (const definition of labelDefinitions) {
                    if (definition.target !== 'block')
                        continue;


                    if (definition.type === 'classification_single' || definition.type === 'classification_multiple') {

                        const labelStatus = block.labels.some(label => label.name === definition.name);

                        const button = textLabeler.addClassificationButton(
                            definition.name,
                            definition.color,
                            definition.type,
                            labelStatus,
                        )

                        button.addEventListener('click', this._onClassificationLabelButtonClick(block.labels, definition.name, definition.type));
                    } else if (definition.type === 'text') {
                        const button = textLabeler.addTextLabelButton(
                            definition.name,
                            definition.color,
                            definition.type,
                            false,
                        )


                        button.addEventListener('click', this._onTextLabelButtonClick(
                            block.labels,
                            textLabeler,
                            block,
                            labelDefinitions,
                            definition.name,
                        ));

                    }
                }
            }
        }
    }

    private _formatBlockText(block: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[]): string {
        let content = block.content


        if (!block.labels || block.labels.length === 0) {
            content = content.replace(/\n/g, '<br>');
            return `<span>${content}</span>`;
        }

        const labels = block.labels.filter(label => 'start' in label && 'end' in label) as TextLabelSchema[];

        const points = new Set<number>([0, content.length]);
        labels.forEach(label => {
            points.add(label.start);
            points.add(label.end);
        });

        const sortedPoints = Array.from(points).sort((a, b) => a - b);

        const segments: ColoredSpan[] = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];
            const mid = (start + end) / 2;

            const overlappingLabels = labels.filter(label => mid >= label.start && mid < label.end);

            let backgroundColor = 'transparent'; // Default for non-labeled text
            let color = '#000000';
            if (overlappingLabels.length === 1) {
                backgroundColor = hexToRgbA(labelDefinitions.find(def => def.name === overlappingLabels[0].name)?.color || "#ffffff", 0.2);
                const luminance = getRelativeLuminance(backgroundColor);
                color = "#000000"; ///"luminance < 0.5 ? '#ffffff' : '#00000'"
            } else if (overlappingLabels.length > 1) {
                const colors: { [key: string]: string } = {};
                overlappingLabels.forEach(label => {
                    const definition = labelDefinitions.find(def => def.name === label.name);
                    if (definition) {
                        colors[label.name] = definition.color;
                    }
                });
                backgroundColor = hexToRgbA(combineHexColors(Object.values(colors)));
                //const luminance = getRelativeLuminance(hexToRgbA(backgroundColor));
                color = "#000000";//luminance < 0.5 ? '#ffffff' : '#00000'
            }

            segments.push({ start, end, backgroundColor, color });


        }

        let html = '';
        segments.forEach(segment => {
            if (segment.start < segment.end) {
                const segmentText = content.substring(segment.start, segment.end);
                if (segment.color !== 'transparent') {
                    html += `<span style="background-color: ${segment.backgroundColor}; color: ${segment.color}">${segmentText}</span>`;
                } else {
                    html += `<span>${segmentText}</span>`;
                }
            }
        });

        return html;
    }


    private _addTextLabelsToList(labeler: TextLabeler, block: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[]) {
        if (!labeler || !block || !labelDefinitions) {
            throw new Error("Labeler, block or label definitions are not available.");
        }

        for (const label of block.labels) {
            if (!('start' in label && 'end' in label)) continue; // Only text labels

            const definition = labelDefinitions.find(def => def.name === label.name);
            if (!definition) continue;

            const color = definition.color || '#000000';
            const content = block.content.substring(label.start, label.end);

            const labelItemContainer = labeler.addTextLabelToList(label.name, color, content)

            const labelItem = labelItemContainer[0];
            const deleteButton = labelItemContainer[1];

            const labelId = label.id || crypto.randomUUID(); // Ensure label has an ID
            label.id = labelId; // Assign ID to the label for internal use

            deleteButton.addEventListener("click", this._onTextLabelDeleteButtonClick(block, labelDefinitions, labeler, labelItem, block.labels, labelId))
        }

    }

    /**
     * On click event listener for document highlights.
     */
    private _onHighlightClick(associatedTab: string, associatedLabeler: HTMLElement): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            this._tabContainer.switchToTab(associatedTab);

            associatedLabeler.scrollIntoView({ behavior: 'smooth', block: 'center' });
            associatedLabeler.classList.add('pulsing');
            associatedLabeler.addEventListener('animationend', () => {
                associatedLabeler.classList.remove('pulsing');
            }, { once: true });
        }
    }

    /**
     * On click event listener for classification laben buttons.
     */
    private _onClassificationLabelButtonClick(associatedLabelList: (LabelSchema | TextLabelSchema)[], labelName: string, labelType: "classification_multiple" | "classification_single"): EventListener {
        return (event: Event) => {
            event.stopPropagation();
            const labelButton = event.currentTarget as LabelButton;

            if (!labelButton) {
                throw new Error("Label button not found in the event target.");
            }

            const currentStatus = labelButton.getAttribute('active') || false;

            if (currentStatus === 'true') {
                let i = 0;
                while (i < associatedLabelList.length) {
                    if (associatedLabelList[i].name === labelName) {
                        associatedLabelList.splice(i, 1);
                    } else {
                        i++;
                    }
                }
                labelButton.setAttribute('active', 'false');
            } else {
                associatedLabelList.push({
                    name: labelName,
                });

                if (labelType === 'classification_single') {
                    let i = 0;
                    while (i < associatedLabelList.length) {
                        if (associatedLabelList[i].name !== labelName) {
                            associatedLabelList.splice(i, 1);
                        } else {
                            i++;
                        }
                    }
                    const siblings = labelButton.parentElement?.children;
                    for (const sibling of siblings || []) {
                        if (sibling instanceof LabelButton &&
                            sibling !== labelButton) {
                            sibling.setAttribute('active', 'false');
                        }
                    }
                }
                labelButton.setAttribute('active', 'true');

            }

        }
    }

    /**
     * On click event listener for classification laben buttons.
     */
    private _onTextLabelButtonClick(associatedLabelList: (LabelSchema | TextLabelSchema)[], associatedLabeler: TextLabeler, associatedBlock: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[], labelName: string): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            const selection = associatedLabeler.getSelection();

            if (!selection) {
                console.warn("No text selection found.");
                return;
            }

            // todo: avoid duplicates! This would lead to the delete button not work anymore

            const labelId = crypto.randomUUID();

            associatedLabelList.push({
                id: labelId,
                name: labelName,
                start: selection.start,
                end: selection.end,
            });

            associatedLabeler.removeSelection();

            const color = labelDefinitions.find(def => def.name === labelName)?.color || '#000000';

            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            const labelItemContainer = associatedLabeler.addTextLabelToList(labelName, color, selection.text)

            const labelItem = labelItemContainer[0];
            const deleteButton = labelItemContainer[1];

            deleteButton.addEventListener("click", this._onTextLabelDeleteButtonClick(associatedBlock, labelDefinitions, associatedLabeler, labelItem, associatedLabelList, labelId))
        }
    }

    private _onTextLabelDeleteButtonClick(associatedBlock: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[], associatedLabeler: TextLabeler, associatedLabelItem: HTMLDivElement, associatedLabelList: (LabelSchema | TextLabelSchema)[], associatedId: string): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            const label = associatedLabelList.find(item => item.id === associatedId)

            if (!label)
                throw new Error(`Label with id ${associatedId} not found in the associated label list.`);

            const index = associatedLabelList.indexOf(label, 0)

            associatedLabelList.splice(index, 1);
            associatedLabelItem.remove();
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));


        }
    }

    /**
     * On click event listener for classification laben buttons.
     */
    private _onPageViewButtonClick(page: number): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            const pageElement = this._documentViewer.getPage(page);
            if (!pageElement) {
                throw new Error(`Page ${page} not found in the document viewer.`);
            }

            pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            pageElement.classList.add('pulsing');
            pageElement.addEventListener('animationend', () => {
                pageElement.classList.remove('pulsing');
            }, { once: true });

        }
    }

    /**
     * On click event listener for classification laben buttons.
     */
    private _onBlockViewButtonClick(associatedViewerElement: HTMLElement): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            associatedViewerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            associatedViewerElement.classList.add('pulsing');
            associatedViewerElement.addEventListener('animationend', () => {
                associatedViewerElement.classList.remove('pulsing');
            }, { once: true });

        }
    }

    /**
     * On click event listener for classification laben buttons.
     */
    private _onBlockEditButtonClick(associatedLabeler: TextLabeler, associatedBlock: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[]): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            // todo: deactivate the label buttons

            // clear the label list in place
            associatedBlock.labels.length = 0; // todo: only remove text labels, not classification? Otherwise also unactivate the classification buttons!
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));

            associatedLabeler.makeTextEditable(this._onBlockTextBlur(associatedBlock, associatedLabeler, labelDefinitions));

        }
    }

    private _onBlockTextBlur(associatedBlock: BlockLabelDataSchema, associatedLabeler: TextLabeler, labelDefinitions: LabelDefinitionSchema[]) {
        return (text: string) => {
            associatedBlock.labels.length = 0; // todo: only remove text labels, not classification? Otherwise also unactivate the classification buttons!
            associatedBlock.content = text.trim();

            // todo: reactivate the label buttons

            // for good measure
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
        }
    }

    /**
     * On click event listener for classification laben buttons.
     */
    private _onSubmitButtonClick(): EventListener {
        return (event: Event) => {
            event.stopPropagation();

            this._submitButton?.setAttribute('disabled', 'true');
            this._submitLabelData()
                .then((success: boolean) => {
                    if (success) {
                        // todo: show success message
                        console.info("Label data submitted successfully.");
                    } else {
                        // todo: show error message
                        console.error("Failed to submit label data.");
                    }
                })
                .catch((error: Error) => {
                    // todo
                    console.error(`Error submitting label data: ${error.message}`);
                })
                .finally(() => {
                    this._submitButton?.removeAttribute('disabled');
                });
        }
    }

    /**
     * Fetches document from the specified URL.
     */
    private async _queryDocument(): Promise<DocumentSchema> {
        if (!this.documentUrl) {
            throw new Error(`Document URL is not set`);
        }
        const response = await fetch(this.documentUrl);
        if (!response.ok) {
            throw new Error(`Document response status: ${response.status}`);
        }

        const content: DocumentSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch document data`);
        }

        return content;
    }

    /**
     * Fetches project from the specified URL.
     */
    private async _queryProject(): Promise<ProjectSchema> {
        if (!this.projectUrl) {
            throw new Error(`Project URL is not set`);
        }
        const response = await fetch(this.projectUrl);
        if (!response.ok) {
            throw new Error(`Project response status: ${response.status}`);
        }

        const content: ProjectSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch project data`);
        }

        return content;
    }

    /**
     * Updates label data using the label data URL.
     */
    private async _submitLabelData(): Promise<boolean> {
        if (!this.updateUrl) {
            throw new Error(`Label data update URL is not set`);
        }
        if (!this._document || !this._document.data) {
            throw new Error(`Document data is not available`);
        }
        const response = await fetch(
            this.updateUrl,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this._document.data)
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