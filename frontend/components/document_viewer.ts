interface DocumentViewerAttributes {
    metadataurl: string;
}

class DocumentViewer extends HTMLElement implements DocumentViewerAttributes {
    public metadataurl: string = '';
    private _style: HTMLStyleElement | null = null;
    private _viewerElement: HTMLDivElement | null = null;
    private _metadata: any | null = null;
    private _pages: HTMLDivElement[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._style = document.createElement('style');
        this._style.textContent = `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow: hidden;
                box-sizing: border-box;
            }

            .document-viewer {
                background-color: var(--document-viewer-background, #ffffff);
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: 1fr;
                grid-auto-rows: min-content;
                padding: 1rem;
                box-sizing: border-box;
                gap: 1rem;
            }

            .document-viewer.loading::before {
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

            .page {
                background-color: var(--document-viewer-page-background, #ffffff);
                box-shadow: var(--document-viewer-page-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `
        this.shadowRoot?.appendChild(this._style);

        this._viewerElement = document.createElement('div');
        this._viewerElement.classList.add('document-viewer');
        const slot = document.createElement('slot');
        this._viewerElement.appendChild(slot);
        this.shadowRoot?.appendChild(this._viewerElement);
    }

    static get observedAttributes() {
        return ['metadataurl'];
    }

    private _updateViewer() {
        if (!this._viewerElement) return;
        this._viewerElement.innerHTML = ''; // Clear previous content
        this._viewerElement.classList.add('loading');

        this.get_metadata().then(metadata => {
            if (!metadata) {
                console.warn('No metadata found or metadata URL is not set.');
                this._viewerElement?.classList.remove('loading');
                return;
            }
            console.log('Metadata fetched:', metadata);
            this._metadata = metadata;
            if (this._metadata.page_count !== undefined) {
                console.log(`Document has ${this._metadata.page_count} pages.`);
                this._add_pages(this._metadata.page_count);
            } else {
                console.warn('Page count could not be determined.');
            }
            this._viewerElement?.classList.remove('loading');
        }).catch(error => {
            console.error('Error fetching metadata:', error);
        });
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        this.metadataurl = newValue || '';

        this._updateViewer();
    }

    connectedCallback() {
        this._viewerElement?.classList.add('loading');
    }

    disconnectedCallback() {

    }

    private _add_pages(pageCount: number) {
        if (!this._viewerElement) return;

        for (let i = 0; i < pageCount; i++) {
            const pageElement = document.createElement('div');
            pageElement.classList.add('page');
            pageElement.textContent = `Page ${i + 1}`;
            pageElement.style.aspectRatio = '8/11'; // Default aspect ratio for a standard page
            this._viewerElement.appendChild(pageElement);
            this._pages.push(pageElement);
        }
    }

    private async get_metadata(): Promise<any | null> {
        if (!this.metadataurl) return null;
        const response = await fetch(this.metadataurl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json;
    }
}

customElements.define('document-viewer', DocumentViewer);
