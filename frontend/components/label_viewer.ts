import { DocumentViewer } from './document_viewer.js';
import { LabelButton } from './label_button.js';

interface LabelViewerAttributes {
    ocrUrl: string;
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
    blocks: OcrItemResponse[];
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
                box-sizing: border-box;
                overflow: hidden;
            }

            .label-viewer {
                background-color: var(--label-viewer-background-color, #ffffff);
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
                scrollbar-color: var(--label-viewer-scrollbar-color, inherit);
            }

            .ocr-block {
                padding: 1rem;
                background-color: var(--document-viewer-page-background, #ffffff);
                border: 1px solid var(--document-viewer-page-border-color, #000000);
                /*box-shadow: var(--document-viewer-page-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));*/
            }

            .ocr-block-content {
                width: 100%;
                field-sizing: content;
                border: none;
                background: transparent;
                font-family: var(--document-viewer-font-family, Arial, sans-serif);
                font-size: var(--document-viewer-font-size, 16px);
                color: var(--document-viewer-font-color, #000000);
                resize: none;
                outline: none;
                box-sizing: border-box;
                padding: 0.5rem;
                line-height: 1.5;
                white-space: pre-wrap;
                word-break: break-word;
                overflow: auto;
                transition: background-color 0.3s ease;
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
            this._ocr = ocr;
            this._addOcrBlocks(ocr);
        }).catch(error => {
            console.error("Error fetching OCR data:", error);
        });
    }

    private _getBlockContent(block: OcrItemResponse): string | null {
        if (!this._ocr) return null;
        if (!block.type || block.type !== "block") return null;
        if (!block.relationships || block.relationships.length === 0) return null;

        const children = this._getBlockChildren(block);

        let text = "t";
        for (const child of children) {
            if (child.type === "word") {
                text += child.content + " ";
            }
        }
        return text
    }

    private _getOcrContent(block: OcrItemResponse, text: string): string {
        if (!this._ocr) return '';

        if (block.content && block.content.length > 0) {
            text += (block.content + " ");
        }

        const lineBreak = "\n";

        const children = this._getBlockChildren(block);
        for (const child of children) {
            if (child.type === "paragraph" && text.length > 0 && !text.endsWith(lineBreak)) {
                text = text.trim() + `${lineBreak}${lineBreak}`;
            } else if (child.type === "line" && text.length > 0 && !text.endsWith(lineBreak)) {
                text = text.trim() + `${lineBreak}`;
            }
            text = this._getOcrContent(child, text);
        }

        return text;
    }

    private _getBlockById(id: string): OcrItemResponse | null {
        if (!this._ocr) return null;
        return this._ocr.blocks.find(block => block.id === id) || null;
    }

    private _getBlockChildren(block: OcrItemResponse): OcrItemResponse[] {
        if (!this._ocr) return [];
        const result = [];
        for (const other_block of this._ocr.blocks) {
            if (other_block.id === block.id) continue;

            for (const relationship of other_block.relationships) {
                if (relationship.type === "child" && relationship.id === block.id) {
                    result.push(other_block);
                }
            }
        }
        return (result);
    }

    private _onHighlightClick(element: HTMLElement) {
        return (event: Event) => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.remove('pulsing');
            element.offsetHeight;
            element.classList.add('pulsing');
        }
    }

    private _onOcrBlockFocus(element: HTMLElement) {
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
            blockElement.classList.add("ocr-block");

            const inputElement = document.createElement("textarea");
            inputElement.classList.add("ocr-block-content");
            inputElement.value = this._getOcrContent(block, "").trim();

            blockElement.appendChild(inputElement);

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
                    blockElement.addEventListener("focusin", this._onOcrBlockFocus(highlightElement as HTMLElement));
            }

            const labelButton = document.createElement("label-button");
            labelButton.setAttribute("color", "#007bff");
            labelButton.setAttribute("shortcut", "1");

            const labelDiv = document.createElement("div");
            labelDiv.slot = "label";
            labelDiv.textContent = `Test Label`;
            labelButton.appendChild(labelDiv);

            blockElement.appendChild(labelButton);


            this._viewerElement.appendChild(blockElement);
        }

    }

    private async _queryOcr(): Promise<OcrResponse | null> {
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

customElements.define('label-viewer', LabelViewer);


/*                    if (!ocr) return;
 

 
                    }
 */