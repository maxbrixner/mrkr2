
/* -------------------------------------------------------------------------- */

interface DocumentViewerAttributes {
    //
}

/* -------------------------------------------------------------------------- */

export class DocumentViewer extends HTMLElement implements DocumentViewerAttributes {
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
        return [];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        // ...
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        this._populateShadowRoot()
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

        Array.from(this.children).forEach((child, idx) => {
            const slotName = child.slot || `page-${idx}`;
            child.setAttribute('slot', slotName);

            const slot = document.createElement('slot');
            slot.name = slotName;
        });

        this._viewerElement.appendChild(slot);
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('document-viewer', DocumentViewer);

/* -------------------------------------------------------------------------- */
