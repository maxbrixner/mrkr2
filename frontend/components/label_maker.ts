/* -------------------------------------------------------------------------- */

import { ResizablePanes } from './resizable_panes.js';
import { DocumentViewer } from './document_viewer.js';
import { TabContainer } from './tab_container.js';

/* -------------------------------------------------------------------------- */

interface LabelMakerAttributes {
    documentMetadataUrl?: string,
    documentContentUrl?: string,
    ocrUrl?: string
    showPages?: 'instantly' | 'first-loaded' | 'all-loaded';
}

interface OcrRelationshipResponse {
    type: string,
    id: string
}

interface OcrItemResponse {
    id: string,
    type: string,
    left: number,
    top: number,
    width: number,
    height: number,
    page: number,
    confidence: number,
    content: string,
    relationships: OcrRelationshipResponse[]
}

interface OcrResponse {
    id: string;
    items: OcrItemResponse[];
    timestamp: string;
}

/* -------------------------------------------------------------------------- */

class LabelMaker extends HTMLElement implements LabelMakerAttributes {
    public documentMetadataUrl?: string = undefined;
    public documentContentUrl?: string = undefined;
    public ocrUrl?: string = undefined;
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
        return ['document-metadata-url', 'document-content-url',
            'ocr-url', 'show-pages'];
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
        } else if (propertyName === 'show-pages') {
            this.showPages = newValue as 'instantly' | 'first-loaded' | 'all-loaded';
            if (this.showPages)
                this._documentViewer.setAttribute('show-pages',
                    this.showPages);
        } else if (propertyName === 'ocr-url') {
            this.ocrUrl = newValue || undefined;
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
        this._tabContainer.appendChild(this._documentTab);

        this._pageTab.slot = 'Page';
        this._tabContainer.appendChild(this._pageTab);

        this._blockTab.slot = 'Block';
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
        this._queryOcr().then(ocr => {
            if (!ocr) {
                // todo: handle this by adding text to show the user
                return;
            }
            console.log("OCR data fetched successfully:", ocr);
            //todo: see label_viewer on what to do here
        }).catch(error => {
            // todo: handle this by showing the user
            throw new Error(`Error fetching OCR data: {error.message}`);
        });
    };

    /**
     * Fetches OCR data from the specified URL and updates the component.
     */
    private async _queryOcr(): Promise<OcrResponse | null> {
        if (!this.ocrUrl) {
            throw new Error(`OCR URL is not set`);
        }
        const response = await fetch(this.ocrUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status} `);
        }

        const content: OcrResponse | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch OCR content`);
        }

        return content;
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('label-maker', LabelMaker);

/* -------------------------------------------------------------------------- */