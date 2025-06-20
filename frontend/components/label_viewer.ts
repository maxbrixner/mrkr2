interface LabelViewerAttributes {
    ocrUrl: string;
}

interface OcrRelationshipResponse {
    type: string,
    id: string
}

interface OcrBlockResponse {
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
    blocks: OcrBlockResponse[];
}

class LabelViewer extends HTMLElement implements LabelViewerAttributes {
    public ocrUrl: string = '';
    private _style: HTMLStyleElement | null = null;
    private _viewerElement: HTMLDivElement | null = null;
    private _ocr: OcrResponse | null = null;

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

            .label-viewer {
                background-color: var(--document-viewer-background, #ffffff);
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-columns: 1fr;
                grid-auto-rows: min-content;
                padding: 2rem;
                box-sizing: border-box;
                gap: 2rem;
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

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `

        this._viewerElement = document.createElement('div');
        this._viewerElement.classList.add('label-viewer', 'loading');
        const slot = document.createElement('slot');
        this._viewerElement.appendChild(slot);

        this.shadowRoot?.appendChild(this._style);
        this.shadowRoot?.appendChild(this._viewerElement);
    }

    static get observedAttributes() {
        return ['ocr-url'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'ocr-url')
            this.ocrUrl = newValue || '';
        else
            console.warn(`Unknown attribute changed in Label Viewer: ${propertyName}`);
    }

    connectedCallback() {
        document.addEventListener('pages-created', this._onPagesCreated as EventListener);
    }

    disconnectedCallback() {
        document.removeEventListener('pages-created', this._onPagesCreated as EventListener);
    }

    private _onPagesCreated = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        console.log('Pages created event received:', detail);
        this._populateViewer();
    }

    private _populateViewer() {
        if (!this._viewerElement) return;
        this._viewerElement.innerHTML = '';
        this._viewerElement.classList.add('loading');

        this._queryOcr().then(ocr => {
            if (!ocr) {
                console.error("No OCR data found.");
                return;
            }
            console.log('OCR data fetched:', ocr);
            this._ocr = ocr;
        }).catch(error => {
            console.error("Error fetching OCR data:", error);
        });
    }

    private async _queryOcr(): Promise<OcrResponse | null> {
        const response = await fetch(this.ocrUrl);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: OcrResponse | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch OCR content`);
        }

        return content;
    }

}

customElements.define('label-viewer', LabelViewer);


/*                    if (!ocr) return;
 
                    for (const block of ocr.blocks) {
                        if (block.type !== "block") continue;
                        if (block.page !== page.page) continue; // Only add blocks for the current page
                        console.log(`Adding OCR block to page ${block.page}:`, block);
 
                        const blockElement = document.createElement("div");
 
                        blockElement.style.position = "absolute";
                        blockElement.style.left = `${block.left * 100 - .1}%`
                        blockElement.style.top = `${block.top * 100 - .1}%`;
                        blockElement.style.width = `${block.width * 100 + .2}%`;
                        blockElement.style.height = `${block.height * 100 + .2}%`;
                        blockElement.style.backgroundColor = "rgba(255, 255, 0, 0.5)"; // Semi-transparent yellow background
                        blockElement.style.border = "1px solid rgba(0, 0, 0, 0.5)"; // Semi-transparent black border
                        blockElement.style.zIndex = "10"; // Ensure it appears above the image
                        blockElement.title = `Block ID: ${block.id}`;
                        blockElement.style.cursor = "pointer"; // Change cursor to pointer for better UX
 
                        pageElement.appendChild(blockElement);
 
                    }
 */