interface DocumentViewerAttributes {
    metadataUrl: string;
    contentUrl: string;
}

interface PagesCreatedEventDetail {
    // ...
}

interface PagesAddedEventDetail {
    //...
}

interface PageMetadataResponse {
    aspect_ratio: number;
    format: string | null;
    height: number;
    mode: string;
    page: number;
    width: number;
}

interface DocumentMetadataResponse {
    pages: PageMetadataResponse[];
    path: string;
}

interface PageContentResponse {
    pages: number;
    content: string;
    mime: string;
}

export class DocumentViewer extends HTMLElement implements DocumentViewerAttributes {
    public metadataUrl: string = '';
    public contentUrl: string = '';
    private _style: HTMLStyleElement | null = null;
    private _viewerElement: HTMLDivElement | null = null;
    private _metadata: DocumentMetadataResponse | null = null;
    private _pages: { [page: number]: HTMLDivElement } = {};

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._style = document.createElement('style');
        this._style.textContent = `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                overflow: hidden;
            }

            .document-viewer {
                background-color: var(--document-viewer-background, #ffffff);
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: 1fr;
                grid-auto-rows: min-content;
                padding: 2rem;
                box-sizing: border-box;
                gap: 2rem;
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                overflow-y: auto;
            }

            .loading::before {
                content: "";
                display: block;
                margin: 2rem auto;
                width: 30px;
                height: 30px;
                border: 4px solid var(--document-viewer-spinner-color, #000000);
                border-top: 4px solid var(--document-viewer-spinner-color-top, #ffffff);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .page.loading::before {
                margin: 4rem auto;
            }

            .error::before {
                content: "error";
                display: block;
            }

            .page {
                user-select: none;
                background-color: var(--document-viewer-page-background, #ffffff);
                box-shadow: var(--document-viewer-page-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
            }

            .highlight {
                position: absolute;
                z-index: 10;
                cursor: pointer;
            }

            .highlight:hover {
                outline: 3px solid var(--document-viewer-block-hover-color);  
            }

            .highlight.pulsing {
                animation: pulse .8s ease-in-out 0s 2 alternate;
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
        `
        this._viewerElement = document.createElement('div');
        this._viewerElement.classList.add('document-viewer', 'loading');
        const slot = document.createElement('slot');
        this._viewerElement.appendChild(slot);

        this.shadowRoot?.appendChild(this._style);
        this.shadowRoot?.appendChild(this._viewerElement);
    }

    static get observedAttributes() {
        return ['metadata-url', 'content-url'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'metadata-url')
            this.metadataUrl = newValue || '';
        else if (propertyName === 'content-url')
            this.contentUrl = newValue || '';
        else
            console.warn(`Unknown attribute changed in Document Viewer: ${propertyName}`);
    }

    connectedCallback() {
        this._populateViewer();
    }

    disconnectedCallback() {
    }

    private _populateViewer() {
        if (!this._viewerElement) return;
        this._viewerElement.innerHTML = '';
        this._viewerElement.classList.add('loading');

        this._queryMetadata().then(metadata => {
            if (!metadata) {
                console.error('No metadata found.');
                return;
            }
            this._createPages(metadata);
            this._dispatchPagesCreatedEvent();
        }).catch(error => {
            console.error('Error fetching metadata:', error);
        });
    }

    private _createPages(metadata: DocumentMetadataResponse | null = null) {
        if (!this._viewerElement) return;
        if (!metadata || !metadata.pages) return;

        for (const page of metadata.pages) {
            const pageElement = document.createElement('div');

            pageElement.classList.add('page', 'loading');

            pageElement.style.padding = 'none';
            pageElement.style.margin = '0 auto';
            pageElement.style.width = '100%';
            pageElement.style.gridRow = `${page.page}`;
            pageElement.style.aspectRatio = `${page.aspect_ratio}`;
            pageElement.style.position = 'relative';

            pageElement.title = `Page ${page.page}`;

            this._pages[page.page] = pageElement;

            this._queryPage(page.page).then(content => {
                if (!content) {
                    console.error(`No content found for page ${page.page}`);
                    pageElement.classList.remove('loading');
                    return;
                }
                this._loadPageContent(pageElement, content);

                if (page.page === 1) // add pages after first page is fully loaded to avoid flickering
                    this._addPagesToViewer();
            }).catch(error => {
                console.error(`Error fetching content for page ${page}:`, error);
                pageElement.classList.remove('loading');
            });
        }
    }

    private _loadPageContent(pageElement: HTMLDivElement, content: PageContentResponse) {
        if (!this._viewerElement) return;

        const imageElement = document.createElement('img');

        imageElement.src = `data:${content.mime};base64,${content.content}`;
        imageElement.alt = pageElement.title;

        imageElement.style.width = '100%';
        imageElement.style.height = 'auto';
        imageElement.style.display = 'block';

        pageElement.appendChild(imageElement);

        pageElement.classList.remove('loading');
    }

    private _addPagesToViewer() {
        if (!this._viewerElement) return;

        this._viewerElement.classList.remove('loading');

        for (const page in this._pages) {
            this._viewerElement.appendChild(this._pages[page]);
        }

        this._dispatchPagesAddedEvent();
    }

    private _dispatchPagesCreatedEvent() {
        this.dispatchEvent(new CustomEvent<PagesCreatedEventDetail>('pages-created', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }

    private _dispatchPagesAddedEvent() {
        this.dispatchEvent(new CustomEvent<PagesAddedEventDetail>('pages-added', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }

    private async _queryMetadata(): Promise<DocumentMetadataResponse | null> {
        const response = await fetch(this.metadataUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const metadata: DocumentMetadataResponse | null = await response.json();

        if (!metadata) {
            throw new Error('Failed to fetch metadata');
        }

        return metadata;
    }

    private async _queryPage(page: number): Promise<PageContentResponse | null> {
        const response = await fetch(`${this.contentUrl}/?page=${page}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: PageContentResponse | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch page ${page} content`);
        }

        return content;
    }

    public addHighlight(
        page: number,
        left: number,
        top: number,
        width: number,
        height: number,
        title: string,
        listeners: { [type: string]: EventListenerOrEventListenerObject } = {}
    ): Element | null {
        if (!this._viewerElement || !this._pages[page]) return null;

        const highlightElement = document.createElement("div");

        highlightElement.classList.add("highlight");
        highlightElement.style.left = `${left * 100 - .1}%`
        highlightElement.style.top = `${top * 100 - .1}%`;
        highlightElement.style.width = `${width * 100 + .2}%`;
        highlightElement.style.height = `${height * 100 + .2}%`;
        highlightElement.title = `${title}`;

        this._pages[page].appendChild(highlightElement);

        for (const type in listeners) {
            highlightElement.addEventListener(type, listeners[type]);
        }

        return (highlightElement);
    }

}

customElements.define('document-viewer', DocumentViewer);
