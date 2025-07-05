import { LabelButton } from './label_button.js';


interface LabelFragmentAttributes {
    heading?: string
}

export class LabelFragment extends HTMLElement implements LabelFragmentAttributes {
    public heading?: string = undefined;
    private _titleDiv: HTMLSpanElement = document.createElement('div');
    private _labelContainer: HTMLDivElement = document.createElement('div');

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
                grid-template-rows: auto 1fr;
            }
            .title {
                font-weight: 500;
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
        active: boolean
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
        button.setAttribute("target", "document");
        button.setAttribute("target-type", "document");

        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;

        button.appendChild(span);

        this._labelContainer.appendChild(button);

    }

    disconnectedCallback() {
        //..
    }

}

customElements.define('label-fragment', LabelFragment);