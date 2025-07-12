/* -------------------------------------------------------------------------- */

import { ResizablePanes } from './resizable_panes.js';
import { DocumentViewer, PagesCreatedEvent, PageClickedEvent, HighlightClickedEvent } from './document_viewer.js';
import { TabContainer } from './tab_container.js';
import { LabelFragment } from './label_fragment.js';
import { LabelButton } from './label_button.js';
import { StyledButton } from './styled_button.js';

/* -------------------------------------------------------------------------- */

interface LabelMakerAttributes {
    projectUrl?: string,
    documentUrl?: string,
    imageUrl?: string,
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

interface ProjectSchema {
    label_definitions: LabelDefinitionSchema[]
    file_provider: any
    ocr_provider: any
}

/* -------------------------------------------------------------------------- */

class LabelMaker extends HTMLElement implements LabelMakerAttributes {
    public projectUrl?: string = undefined;
    public documentUrl?: string = undefined;
    public imageUrl?: string = undefined

    private _document?: DocumentSchema = undefined;
    private _project?: ProjectSchema = undefined;

    private _resizablePanes = new ResizablePanes();
    private _documentViewer = new DocumentViewer();
    private _tabContainer = new TabContainer();
    private _controlBar = document.createElement('div');

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
        return ['document-url', 'project-url', 'image-url'];
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
                grid-template-rows: 1fr auto;
            }

            .control-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem;
                border-top: 1px solid var(--label-fragment-border-color);
                background-color: var(--label-fragment-title-background-color);
                height: 100px;
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
            .pulsing {
                animation: pulse .8s ease-in-out 0s 2 alternate;
            }

            .loading::before {
                content: "";
                display: block;
                margin: 2rem auto;
                width: var(--spinner-size-large, 30px);
                height: var(--spinner-size-large, 30px);
                border: var(--spinner-border-large, 4px) solid var(--spinner-color, #000000);
                border-top: var(--spinner-border-large, 4px) solid var(--spinner-color-top, #ffffff);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes pulse {
                0% {
                    outline: 0px solid transparent;
                }

                50% {
                    outline: 3px solid var(--document-viewer-pulse-color);               
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

        this._controlBar.className = 'control-bar';

        /*
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
        */

        this.shadowRoot.appendChild(this._resizablePanes);
        this.shadowRoot.appendChild(this._controlBar);
    }

    /**
     * Adds event listeners to the component.
     */
    private _addEventListeners() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this.shadowRoot.addEventListener('pages-created', (event: Event) => {
            const customEvent = event as CustomEvent<PagesCreatedEvent>;
            this._queryContent(this._populateContent.bind(this));
        });

        this.shadowRoot.addEventListener('page-clicked', (event: Event) => {
            const customEvent = event as CustomEvent<PageClickedEvent>;
            console.log("Page clicked", customEvent.detail);
        });

    }

    /**
     * Remove event listeners to the component.
     */
    private _removeEventListeners() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this.shadowRoot.removeEventListener('pages-created', (event: Event) => {
            const customEvent = event as CustomEvent<PagesCreatedEvent>;
            this._queryContent(this._populateContent.bind(this));
        });

        this.shadowRoot.removeEventListener('page-clicked', (event: Event) => {
            const customEvent = event as CustomEvent<PageClickedEvent>;
            console.log("Page clicked", customEvent.detail);
        });
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

        for (const page of this._document.data.pages) {
            for (const block of page.blocks) {
                this._documentViewer.addHighlight(
                    page.page,
                    block.position.left,
                    block.position.top,
                    block.position.width,
                    block.position.height,
                    `Block ${block.id}`
                );
            }
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

}

/* -------------------------------------------------------------------------- */

customElements.define('label-maker', LabelMaker);

/* -------------------------------------------------------------------------- */