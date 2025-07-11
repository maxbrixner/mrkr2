
/* -------------------------------------------------------------------------- */

interface DocumentViewerAttributes {
    metadataUrl?: string;
    contentUrl?: string;
    showPages?: 'instantly' | 'first-loaded' | 'all-loaded';
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

/* -------------------------------------------------------------------------- */

export class DocumentViewer extends HTMLElement implements DocumentViewerAttributes {
    public metadataUrl?: string = undefined;
    public contentUrl?: string = undefined;
    public showPages?: "instantly" | "first-loaded" | "all-loaded" = undefined;
    private _viewerElement: HTMLDivElement | null = null;
    private _pages: { [page: number]: HTMLDivElement } = {};

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
        return ['metadata-url', 'content-url', 'show-pages'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'metadata-url') {
            this.metadataUrl = newValue || undefined;
        } else if (propertyName === 'content-url') {
            this.contentUrl = newValue || undefined;
        } else if (propertyName === 'show-pages') {
            if (newValue !== 'instantly' && newValue !== 'first-loaded' &&
                newValue !== 'all-loaded') {
                return;
            }
            this.showPages = newValue || 'all-loaded';
        }

        this._populateViewer();
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            return;
        }

        const style = document.createElement('style');

        // todo: we do not need the document-viewer div - we can just use the host?
        style.textContent = `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                overflow: hidden;
                user-select: none;
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
                scrollbar-color: var(--document-viewer-scrollbar-color, inherit);
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

            .error::before {
                content: "error";
                display: block;
            }

            .page {
                user-select: none;
                background-color: var(--document-viewer-page-background, #ffffff);
                box-shadow: var(--document-viewer-page-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
                position: relative;
                padding: none;
                margin: 0 auto;
                width: 100%;
            }

            .page > img {
                width: 100%;
                height: auto;
                display: block
            }

            .page.loading::before {
                margin: 4rem auto;
            }

            .highlight {
                position: absolute;
                z-index: 10;
                cursor: pointer;
            }

            .highlight:hover {
                outline: 3px solid var(--document-viewer-block-hover-color);  
            }

            .pulsing {
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

        this.shadowRoot?.appendChild(style);
        this.shadowRoot?.appendChild(this._viewerElement);
    }

    /**
     * Populates the viewer with pages based on the metadata and content URLs.
     * This method fetches the metadata and content for each page, creates
     * the page elements, and adds them to the viewer.
     */
    private _populateViewer() {
        if (!this.metadataUrl || !this.contentUrl || !this.showPages) {
            return;
        }
        if (!this._viewerElement) return;

        this._viewerElement.innerHTML = '';

        this._viewerElement.classList.add('loading');

        this._queryMetadata().then(metadata => {
            if (!metadata) {
                // todo: handle this by adding text to show the user
                return;
            }
            this._createPages(metadata);
            if (this.showPages === 'instantly')
                this._addPagesToViewer();
            this._dispatchPagesCreatedEvent();
        }).catch(error => {
            // todo: handle this by showing the user
            throw new Error(`Error fetching document metadata: {error.message}`);
        });
    }

    /**
     * Creates page elements based on the metadata.
     * Each page element is created with the appropriate styles and attributes,
     * and the content is fetched asynchronously.
     */
    private _createPages(metadata: DocumentMetadataResponse | null = null) {
        if (!this._viewerElement) return;
        if (!metadata || !metadata.pages) return;

        for (const page of metadata.pages) {
            const pageElement = document.createElement('div');

            pageElement.classList.add('page');

            if (this.showPages === 'instantly')
                pageElement.classList.add('loading');

            if (page.page > 1 && this.showPages === 'first-loaded')
                pageElement.classList.add('loading');

            pageElement.style.gridRow = `${page.page}`;
            pageElement.style.aspectRatio = `${page.aspect_ratio}`;

            pageElement.title = `Page ${page.page}`;

            this._pages[page.page] = pageElement;

            this._queryPage(page.page).then(content => {
                if (!content) {
                    // todo: handle this by showing the user
                    pageElement.classList.remove('loading');
                    return;
                }
                this._loadPageContent(pageElement, content);

                if (this.showPages === 'first-loaded' && page.page === 1)
                    this._addPagesToViewer();

                if (this.showPages === 'all-loaded' && page.page === metadata.pages.length)
                    this._addPagesToViewer();
            }).catch(error => {
                pageElement.classList.remove('loading');
                // todo: handle this by showing the user
                throw new Error(`Error fetching content for page ${page}: 
                    ${error.message}`);
            });
        }
    }

    /**
     * Loads the content of a page into the page element.
     * This method creates an image element, sets its source to the base64
     * content, and appends it to the page element.
     */
    private _loadPageContent(pageElement: HTMLDivElement, content: PageContentResponse) {
        if (!this._viewerElement) return;

        const imageElement = document.createElement('img');

        imageElement.src = `data:${content.mime};base64,${content.content}`;
        imageElement.alt = pageElement.title;

        pageElement.appendChild(imageElement);

        pageElement.classList.remove('loading');
    }

    /**
     * Adds all created pages to the viewer element.
     * This method removes the loading class from the viewer element and appends
     * each page element to the viewer. It also dispatches a custom event to notify
     * that pages have been added.
     */
    private _addPagesToViewer() {
        if (!this._viewerElement) return;

        this._viewerElement.classList.remove('loading');

        for (const page in this._pages) {
            this._viewerElement.appendChild(this._pages[page]);
        }

        this._dispatchPagesAddedEvent();
    }

    /**
     * Dispatches a custom event indicating that pages have been created.
     * This event can be used by other components to react to the creation of pages.
     * It bubbles up through the DOM and can be composed to cross shadow DOM boundaries.
     */
    private _dispatchPagesCreatedEvent() {
        this.dispatchEvent(new CustomEvent<PagesCreatedEventDetail>('pages-created', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Dispatches a custom event indicating that pages have been added to the viewer.
     * This event can be used by other components to react to the addition of pages.
     * It bubbles up through the DOM and can be composed to cross shadow DOM boundaries.
     */
    private _dispatchPagesAddedEvent() {
        this.dispatchEvent(new CustomEvent<PagesAddedEventDetail>('pages-added', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Queries the metadata from the metadata URL.
     * This method fetches the metadata and returns it as a JSON object.
     * If the metadata URL is not set or the response is not OK, it throws an error.
     */
    private async _queryMetadata(): Promise<DocumentMetadataResponse | null> {
        if (!this.metadataUrl) {
            throw new Error('Metadata URL is not set');
        }
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

    /**
     * Queries the content of a specific page from the content URL.
     * This method fetches the content for the specified page and returns it as a JSON object.
     * If the content URL is not set or the response is not OK, it throws an error.
     */
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

    /**
     * Scrolls to a specific page in the viewer.
     */
    public scrollToPage(page: number) {
        if (!this._viewerElement || !this._pages[page]) return;
        const pageElement = this._pages[page];
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pageElement.classList.remove('pulsing');
        pageElement.offsetHeight;
        pageElement.classList.add('pulsing');
    }

    /**
     * Adds an event listener to a specific page.
     */
    public addPageEventListener(
        page: number,
        type: string,
        listener: EventListenerOrEventListenerObject
    ): void {
        if (!this._viewerElement || !this._pages[page]) return;

        const pageElement = this._pages[page];
        pageElement.addEventListener(type, listener);
    }

    /**
     * Adds a highlight to a specific page.
     * This method creates a highlight element with the specified position and size,
     * sets its title, and appends it to the specified page element.
     * It also adds event listeners to the highlight element if provided.
     */
    public addHighlight(
        page: number,
        left: number,
        top: number,
        width: number,
        height: number,
        title: string,
        listeners: { [type: string]: EventListenerOrEventListenerObject } = {}
    ): HTMLElement | null {
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

/* -------------------------------------------------------------------------- */

customElements.define('document-viewer', DocumentViewer);

/* -------------------------------------------------------------------------- */
