import { DocumentViewer } from './document_viewer.js';

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
    id: string;
    blocks: OcrBlockResponse[];
    timestamp: string;
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

            .ocr-block {
                background-color: var(--document-viewer-page-background, #ffffff);
                box-shadow: var(--document-viewer-page-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
            }

            .ocr-block.pulsing {
                animation: pulse .8s ease-in-out 0s 2 alternate;
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
                animation: spin .8s linear infinite;
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
                    outline: 3px solid var(--label-viewer-pulse-color);               
                }

                100% {
                    outline: 0px solid transparent;
                }
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
            this._addOcrBlocks(ocr);
        }).catch(error => {
            console.error("Error fetching OCR data:", error);
        });
    }

    private _onHighlightClick(element: HTMLElement) {
        return (event: Event) => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.remove('pulsing');
            element.offsetHeight;
            element.classList.add('pulsing');
        }
    }

    private _onOcrBlockClick(element: HTMLElement) {
        return (event: Event) => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.remove('pulsing');
            element.offsetHeight;
            element.classList.add('pulsing');
        }
    }

    private _addOcrBlocks(ocr: OcrResponse) {
        if (!this._viewerElement || !ocr) return;

        this._viewerElement.classList.remove('loading');

        const documentViewer = document.querySelector('document-viewer') as DocumentViewer | null;
        if (!documentViewer)
            console.warn("Document Viewer not found.");

        for (const block of ocr.blocks) {
            if (block.type !== "block") continue;

            const blockElement = document.createElement("div");
            blockElement.innerHTML = block.id;
            blockElement.style.height = "100px";
            blockElement.classList.add("ocr-block");

            if (documentViewer) {
                const highlightElement = documentViewer.addHighlight(
                    block.page,
                    block.left,
                    block.top,
                    block.width,
                    block.height,
                    `Block ID: ${block.id}`,
                    { "click": this._onHighlightClick(blockElement) }
                );
                if (highlightElement)
                    blockElement.addEventListener("click", this._onOcrBlockClick(highlightElement as HTMLElement));
            }

            this._viewerElement.appendChild(blockElement);
        }

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
 

 
                    }
 */