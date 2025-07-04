/* -------------------------------------------------------------------------- */

import { ResizablePanes } from './resizable_panes.js';
import { DocumentViewer } from './document_viewer.js';
import { TabContainer } from './tab_container.js';
import { LabelFragment } from './label_fragment.js';

/* -------------------------------------------------------------------------- */

interface LabelMakerAttributes {
    documentMetadataUrl?: string,
    documentContentUrl?: string,
    documentLabeldataUrl?: string,
    projectLabelDefinitionUrl?: string
    showPages?: 'instantly' | 'first-loaded' | 'all-loaded';
}

interface LabelSchema {
    name: string
}

interface TextLabelSchema extends LabelSchema {
    content_start: number
    content_end: number
}

interface PositionSchema extends LabelSchema {
    left: number
    top: number
    width: number
    height: number
}

interface BlockLabelDataSchema {
    id: string
    labels: LabelSchema[]
    text_labels: TextLabelSchema[]
    position: PositionSchema
    content: string
}

interface PageLabelDataSchema {
    id: string
    page: number
    labels: LabelSchema[]
    blocks: BlockLabelDataSchema
}

interface DocumentLabelDataSchema {
    labels: LabelSchema[]
    pages: PageLabelDataSchema[]
}

interface LabelDefinitionSchema {
    type: string
    targets: string[]
    name: string
    color: string
}

/* -------------------------------------------------------------------------- */

class LabelMaker extends HTMLElement implements LabelMakerAttributes {
    public documentMetadataUrl?: string = undefined;
    public documentContentUrl?: string = undefined;
    public documentLabeldataUrl?: string = undefined;
    public projectLabelDefinitionUrl?: string = undefined;
    public showPages?: 'instantly' | 'first-loaded' | 'all-loaded' = undefined;
    private _resizablePanes: ResizablePanes = new ResizablePanes();
    private _documentViewer: DocumentViewer = new DocumentViewer();
    private _tabContainer: TabContainer = new TabContainer();
    private _documentTab: HTMLDivElement = document.createElement('div');
    private _pageTab: HTMLDivElement = document.createElement('div');
    private _blockTab: HTMLDivElement = document.createElement('div');

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
                padding: 1rem;
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

        this._documentTab.slot = 'Document';
        this._documentTab.classList.add("tab-content");
        this._tabContainer.appendChild(this._documentTab);

        this._pageTab.slot = 'Page';
        this._pageTab.classList.add("tab-content");
        this._tabContainer.appendChild(this._pageTab);

        this._blockTab.slot = 'Block';
        this._blockTab.classList.add("tab-content");
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
    }

    /**
     * Removes event listeners from the component.
     */
    private _removeEventListeners() {
        this.shadowRoot?.removeEventListener(
            'pages-created',
            this._onPagesCreated as EventListener
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
            console.log("Label definitions fetched successfully:", definitions);

            this._addDocumentLabelers(definitions);
        }).catch(error => {
            // todo: handle this by showing the user
            throw new Error(`Error fetching label definitions: ${error.message}`);
        });
    };

    private _addDocumentLabelers(definitions: LabelDefinitionSchema[]) {
        const fragment = new LabelFragment();

        console.log("aaa", definitions)

        for (const definition of definitions) {
            fragment.add_label_button();
        }

        this._documentTab.appendChild(fragment);
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
            throw new Error(`Response status: ${response.status} `);
        }

        const content: DocumentLabelDataSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch label data`);
        }

        return content;
    }

    /**
     * Fetches project configuration.
     */
    private async _queryLabelDefinitions(): Promise<LabelDefinitionSchema[] | null> {
        if (!this.projectLabelDefinitionUrl) {
            throw new Error(`Label definition URL is not set`);
        }
        const response = await fetch(this.projectLabelDefinitionUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status} `);
        }

        const content: LabelDefinitionSchema[] | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch label definitions`);
        }

        return content;
    }


}

/* -------------------------------------------------------------------------- */

customElements.define('label-maker', LabelMaker);

/* -------------------------------------------------------------------------- */