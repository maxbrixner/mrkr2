export class DocumentViewer extends HTMLElement {
    _url = '';
    _pages = {};
    get url() {
        return this.getAttribute('url') || '';
    }
    set url(value) {
        this.setAttribute('url', value || '');
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ["url"];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'url') {
            this._url = newValue || '';
            this._reset();
            this._addPages();
        }
    }
    connectedCallback() {
    }
    disconnectedCallback() {
    }
    _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const style = document.createElement('style');
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
                border: var(--spinner-border-large) solid var(--spinner-color, #000000);
                border-radius: 50%; 
                border-top: var(--spinner-border-large) solid var(--spinner-color-top, #ffffff);
                content: "";
                display: block;
                height: var(--spinner-size-large, 30px);
                margin: 2rem auto;
                width: var(--spinner-size-large, 30px);
            }

            :host(.error)::before {
                color: var(--styled-dialog-error-color, #000000);
                content: var(--styled-dialog-error-message, 'Error loading content');
                display: block;
                font-size: var(--styled-dialog-error-font-size, 1rem);
                margin: 2rem auto;
                text-align: center;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
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
        this.classList.remove('error');
        this.classList.add('loading');
    }
    _reset() {
        this.innerHTML = '';
        this.classList.remove('error');
        this.classList.add('loading');
        this._pages = {};
    }
    _addPages() {
        this._queryContent()
            .then((content) => {
            this.classList.remove('loading');
            content.forEach((pageContent) => {
                this._addPage(pageContent.page, pageContent.aspect_ratio, pageContent.format, pageContent.content);
            });
            this._dispatchPagesCreatedEvent();
        })
            .catch((error) => {
            this._dispatchPagesLoadErrorEvent();
            this.classList.remove('loading');
            this.classList.add('error');
        });
    }
    _dispatchPagesCreatedEvent() {
        this.dispatchEvent(new CustomEvent('pages-created', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }
    _dispatchPagesLoadErrorEvent() {
        this.dispatchEvent(new CustomEvent('pages-load-error', {
            detail: {},
            bubbles: true,
            composed: true
        }));
    }
    _addPage(page, aspect_ratio, format, content) {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const pageElement = document.createElement('button');
        pageElement.classList.add('page');
        pageElement.style.gridRow = `${page}`;
        pageElement.title = `Page ${page}`;
        const mime = this._getMimeFromFormat(format);
        const imageElement = document.createElement('img');
        imageElement.src = `data:${mime};base64,${content}`;
        imageElement.style.aspectRatio = `${aspect_ratio}`;
        imageElement.alt = `Page ${page}`;
        pageElement.appendChild(imageElement);
        pageElement.addEventListener('click', (event) => {
            event.stopPropagation();
            this._dispatchPageClickedEvent(page);
        });
        this._pages[page] = pageElement;
        this.shadowRoot.appendChild(pageElement);
    }
    getPage(page) {
        return this._pages[page];
    }
    _dispatchPageClickedEvent(page) {
        this.dispatchEvent(new CustomEvent('page-clicked', {
            detail: {
                page: page
            },
            bubbles: true,
            composed: true
        }));
    }
    addHighlight(page, left, top, width, height, label, id) {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const highlightElement = document.createElement("button");
        highlightElement.classList.add("highlight");
        highlightElement.style.left = `${left * 100 - .1}%`;
        highlightElement.style.top = `${top * 100 - .1}%`;
        highlightElement.style.width = `${width * 100 + .2}%`;
        highlightElement.style.height = `${height * 100 + .2}%`;
        highlightElement.ariaLabel = label;
        highlightElement.addEventListener('click', (event) => {
            event.stopPropagation();
            this._dispatchHighlightClickedEvent(id);
        });
        this._pages[page].appendChild(highlightElement);
        return (highlightElement);
    }
    _dispatchHighlightClickedEvent(id) {
        this.dispatchEvent(new CustomEvent('highlight-clicked', {
            detail: {
                id: id
            },
            bubbles: true,
            composed: true
        }));
    }
    _getMimeFromFormat(format) {
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
    async _queryContent() {
        if (!this._url) {
            throw new Error("URL is not set for DocumentViewer");
        }
        const response = await fetch(this._url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const content = await response.json();
        if (!content) {
            throw new Error(`Failed to fetch document content`);
        }
        return content;
    }
}
customElements.define('document-viewer', DocumentViewer);
