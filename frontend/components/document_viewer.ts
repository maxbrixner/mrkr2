interface DocumentViewerAttributes {
    metadataurl: string;
    contenturl: string;
}

interface PageMetadataResponse {
    aspect_ratio: number;
    format: string | null;
    height: number;
    mode: string;
    page: number;
    width: number;
}

interface FileMetadataResponse {
    pages: PageMetadataResponse[];
    path: string;
}

interface PageContentResponse {
    pages: number;
    content: string;
    mime: string;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class DocumentViewer extends HTMLElement implements DocumentViewerAttributes {
    public metadataurl: string = '';
    public contenturl: string = '';
    private _style: HTMLStyleElement | null = null;
    private _viewerElement: HTMLDivElement | null = null;
    private _metadata: FileMetadataResponse | null = null;
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
        this._viewerElement.classList.add('document-viewer', 'loading');
        const slot = document.createElement('slot');
        this._viewerElement.appendChild(slot);
        this.shadowRoot?.appendChild(this._viewerElement);
    }

    static get observedAttributes() {
        return ['metadataurl', 'contenturl'];
    }



    private _updateViewer() {
        if (!this._viewerElement) return;
        this._viewerElement.innerHTML = ''; // Clear previous content
        this._viewerElement.classList.add('loading');

        this._query_metadata().then(() => {
            console.log('Metadata fetched successfully:', this._metadata);
            this._add_pages();
        }).catch(error => {
            console.error('Error fetching metadata');
        });
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        if (propertyName === 'metadataurl')
            this.metadataurl = newValue || '';
        if (propertyName === 'contenturl')
            this.contenturl = newValue || '';


    }

    connectedCallback() {
        this._updateViewer();
    }

    disconnectedCallback() {
    }

    private _add_pages() {
        if (!this._viewerElement) return;
        if (!this._metadata || !this._metadata.pages) return;

        for (const page of this._metadata.pages) {
            const pageElement = document.createElement('div');
            pageElement.classList.add('page', 'loading');
            pageElement.style.aspectRatio = page.aspect_ratio.toString(); // Default aspect ratio for a standard page
            pageElement.title = `Page ${page.page}`;
            this._pages.push(pageElement);

            const imageElement = document.createElement('img');

            this._query_page(page.page).then(content => {
                console.log(`Content for page ${page.page} fetched successfully`);
                if (content) {
                    if (!this._viewerElement) return;
                    imageElement.src = `data:${content.mime};base64,${content.content}`;
                    imageElement.alt = `Page ${page.page} content`;
                    imageElement.style.width = '100%';
                    imageElement.style.height = '100%';
                    pageElement.appendChild(imageElement);
                    pageElement.classList.remove('loading');
                    this._viewerElement.appendChild(pageElement);
                    this._viewerElement.classList.remove('loading');

                } else {
                    imageElement.textContent = `Page ${page.page} content not available`;
                }

            }).catch(error => {
                console.error(`Error fetching content for page ${page.page}:`, error);
            });


        }


    }

    private async _query_metadata(): Promise<FileMetadataResponse | null> {
        const [response] = await Promise.all([
            fetch(this.metadataurl),
            delay(0)
        ]);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const metadata: FileMetadataResponse | null = await response.json();

        if (!metadata) {
            throw new Error('Failed to fetch metadata');
        }

        this._metadata = metadata;

        return metadata;
    }

    private async _query_page(page: number): Promise<PageContentResponse | null> {
        const [response] = await Promise.all([
            fetch(`${this.contenturl}/?page=${page}`),
            delay(0)
        ]);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: PageContentResponse | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch page ${page} content`);
        }

        return content;
    }

}

customElements.define('document-viewer', DocumentViewer);
