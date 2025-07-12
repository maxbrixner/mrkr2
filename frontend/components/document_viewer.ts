
/* -------------------------------------------------------------------------- */

interface DocumentViewerAttributes {
    url?: string;
}

/* -------------------------------------------------------------------------- */

export interface PagesCreatedEvent {
    // ...
}

/* -------------------------------------------------------------------------- */


export interface PageClickedEvent {
    page: number;
}

/* -------------------------------------------------------------------------- */

export interface HighlightClickedEvent {
    name: string;
}

/* -------------------------------------------------------------------------- */

interface PageContentSchema {
    content: string; // Base64 encoded image content
    page: number;
    width: number;
    height: number;
    aspect_ratio: number;
    format: string; // Image format (e.g., JPEG, PNG)
    mode: string; // Color mode (e.g., RGB, L)
}

/* -------------------------------------------------------------------------- */

export class DocumentViewer extends HTMLElement implements DocumentViewerAttributes {
    public url: string | undefined;
    private _pages: { [page: number]: HTMLButtonElement } = {};

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
        return ["url"];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'url') {
            this.url = newValue || undefined;
            this._reset()
            this._addPages();
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        // ...
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        // ...
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');

        // todo: we do not need the document-viewer div - we can just use the host?
        style.textContent = `
            :host {
                background-color: var(--document-viewer-background, #ffffff);
                box-sizing: border-box;
                display: grid;
                gap: 2rem;
                grid-auto-rows: min-content;
                grid-template-columns: 1fr;
                height: 100%;
                overflow-y: auto;
                padding: 2rem;
                scrollbar-color: var(--document-viewer-scrollbar-color, inherit);
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                user-select: none;
                width: 100%;
            }

            .page {
                background-color: var(--document-viewer-page-background, #ffffff);    
                border: none;
                box-shadow: var(--document-viewer-page-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
                box-sizing: border-box;
                padding: 0;
                position: relative;
                user-select: none;
                width: 100%;
            }

            .page > img {
                display: block;
                height: auto;
                width: 100%;
                z-index: 1;
            }

            .highlight {
                background-color: var(--document-viewer-highlight-background-color, transparent);
                border: none;
                cursor: pointer;
                outline-color: var(--document-viewer-highlight-outline-color, #000000);
                outline-style: solid;
                outline-width: var(--document-viewer-highlight-outline-width, 0px);
                position: absolute;
                z-index: 2;
            }

            .page:focus {
                outline-color: var(--document-viewer-page-focus-outline-color, #000000);    
                outline-style: solid;
                outline-width: var(--document-viewer-page-focus-outline-width, 2px);
            }

            .highlight:focus,
            .highlight:hover {
                outline-color: var(--document-viewer-highlight-focus-outline-color, #000000);    
                outline-style: solid;
                outline-width: var(--document-viewer-highlight-focus-outline-width, 2px);
            }

           :host(.loading)::before {
                animation: spin 1s linear infinite;    
                border: 4px solid var(--spinner-color, #000000);
                border-radius: 50%; 
                border-top: 4px solid var(--spinner-color-top, #ffffff);
                content: "";
                display: block;
                height: 30px;
                margin: 2rem auto;
                width: 30px;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }
        `

        this.shadowRoot?.appendChild(style);

        this.classList.add('loading');
    }

    /**
     * Resets the viewer by clearing the content and preparing for a new document.
     */
    private _reset() {
        this.innerHTML = '';
        this.classList.add('loading');
        this._pages = {};
    }

    /**
     * Queries the content of the document and adds pages to the viewer.
     */
    private _addPages() {
        this._queryContent()
            .then((content: PageContentSchema[]) => {
                this.classList.remove('loading');
                content.forEach((pageContent) => {
                    this._addPage(pageContent.page, pageContent.aspect_ratio, pageContent.format, pageContent.content);
                });

                this._dispatchPagesCreatedEvent();

            })
            .catch((error) => {
                console.error("Error fetching document content:", error);
                // todo: show error to user
            });
    }

    /**
     * Dispatches a custom event indicating that pages have been created.
     */
    private _dispatchPagesCreatedEvent() {
        this.dispatchEvent(new CustomEvent<PagesCreatedEvent>('pages-created', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Adds a single page to the viewer.
     */
    private _addPage(page: number, aspect_ratio: number, format: string, content: string) {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const pageElement = document.createElement('button');
        pageElement.classList.add('page');
        pageElement.style.gridRow = `${page}`;
        pageElement.style.aspectRatio = `${aspect_ratio}`;
        pageElement.title = `Page ${page}`;

        const mime = this._getMimeFromFormat(format);

        const imageElement = document.createElement('img');
        imageElement.src = `data:${mime};base64,${content}`;
        imageElement.alt = `Page ${page}`;

        pageElement.appendChild(imageElement);

        pageElement.addEventListener('click', (event: Event) => {
            event.stopPropagation();
            this._dispatchPageClickedEvent(page);
        });

        this._pages[page] = pageElement;

        this.shadowRoot.appendChild(pageElement);
    }

    /**
     * Dispatches a custom event when a page is clicked.
     */
    private _dispatchPageClickedEvent(page: number) {
        this.dispatchEvent(new CustomEvent<PageClickedEvent>('page-clicked', {
            detail: {
                page: page
            },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Adds a highlight to a specific page in the document viewer.
     */
    public addHighlight(
        page: number,
        left: number,
        top: number,
        width: number,
        height: number,
        title: string
    ): HTMLButtonElement {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const highlightElement = document.createElement("button");

        highlightElement.classList.add("highlight");
        highlightElement.style.left = `${left * 100 - .1}%`
        highlightElement.style.top = `${top * 100 - .1}%`;
        highlightElement.style.width = `${width * 100 + .2}%`;
        highlightElement.style.height = `${height * 100 + .2}%`;
        highlightElement.ariaLabel = title;

        highlightElement.addEventListener('click', (event: Event) => {
            event.stopPropagation();
            this._dispatchHighlightClickedEvent(title);
        });

        this._pages[page].appendChild(highlightElement);

        return (highlightElement);
    }

    /**
     * Dispatches a custom event when a highlight is clicked.
     */
    private _dispatchHighlightClickedEvent(name: string) {
        this.dispatchEvent(new CustomEvent<HighlightClickedEvent>('highlight-clicked', {
            detail: {
                name: name
            },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Returns the MIME type based on the image format.
     */
    private _getMimeFromFormat(format: string): string {
        switch (format.toLowerCase()) {
            case 'jpeg':
            case 'jpg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            default:
                throw new Error(`Unsupported image format: ${format}`);
        }
    }

    /**
     * Queries the content of the document and returns it as an array of PageContentSchema.
     */
    private async _queryContent(): Promise<PageContentSchema[]> {
        if (!this.url) {
            throw new Error("URL is not set for DocumentViewer");
        }

        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: PageContentSchema[] | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch document content`);
        }

        return content;
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('document-viewer', DocumentViewer);

/* -------------------------------------------------------------------------- */
