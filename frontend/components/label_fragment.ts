import { LabelButton } from './label_button.js';


interface LabelFragmentAttributes {
    heading?: string
}

export class LabelFragment extends HTMLElement implements LabelFragmentAttributes {
    public heading?: string = undefined;
    private _titleDiv: HTMLSpanElement = document.createElement('div');
    private _labelContainer: HTMLDivElement = document.createElement('div');
    private _textContainer: HTMLDivElement = document.createElement('div');
    private _textArea: HTMLDivElement = document.createElement('div');

    /**
     * Creates an instance of LabelFragment.
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
        return ['heading'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'heading') {
            this.heading = newValue || undefined;
        }

        this._populateShadowRoot();
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: grid;
                border: 1px solid var(--label-fragment-border-color);
                border-radius: var(--label-fragment-border-radius);
                user-select: none;
                grid-template-rows: auto 1fr auto;
            }
            .title {
                font-weight: 500;
                font-size: 0.9rem;
                padding: 0.5em;
                background-color: var(--label-fragment-title-background-color);
                color: var(--label-fragment-title-color);
                border-bottom: 1px solid var(--label-fragment-border-color);
            }
            .label-container {
                display: flex;
                flex-wrap: wrap;
                padding: 0.5em;
                gap: 0.5em;
            }
            .text-container {
                padding: 0.5em;
                font-size: 0.9rem;
                color: var(--label-fragment-text-color);
                border-top: 1px solid var(--label-fragment-border-color);
            }
            .text-area {
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
        `;
        this.shadowRoot?.appendChild(style);

        this._titleDiv.className = "title";
        this._titleDiv.textContent = this.heading || "Label Fragment";
        this.shadowRoot?.appendChild(this._titleDiv);

        this._labelContainer.className = "label-container";
        this.shadowRoot?.appendChild(this._labelContainer);
    }

    public add_label_button(
        name: string,
        color: string,
        type: string,
        active: boolean,
        targetType: "document" | "page" | "block",
        target: string
    ) {
        if (!this._labelContainer) {
            console.error("Label container is not initialized.");
            return;
        }

        const button = new LabelButton();
        button.setAttribute("color", color);
        button.setAttribute("name", name);
        button.setAttribute("type", type);
        button.setAttribute("active", active.toString());
        button.setAttribute("target", target);
        button.setAttribute("target-type", targetType);

        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;

        button.appendChild(span);

        this._labelContainer.appendChild(button);

    }

    public add_text(text: string) {
        this._textContainer.className = "text-container";
        this._textArea.className = "text-area";

        const tests = document.createElement('span');
        tests.textContent = "";
        tests.style.backgroundColor = "transparent";
        this._textArea.appendChild(tests);

        const test = document.createElement('span');
        test.textContent = "Click to edit";
        test.style.backgroundColor = "red";
        this._textArea.appendChild(test);

        const test2 = document.createElement('span');
        test2.textContent = text;
        test2.style.backgroundColor = "transparent";
        this._textArea.appendChild(test2);


        this._textArea.setAttribute("contenteditable", "true");
        this._textContainer.appendChild(this._textArea);
        this.shadowRoot?.appendChild(this._textContainer);
    }

    disconnectedCallback() {
        //..
    }


}

customElements.define('label-fragment', LabelFragment);