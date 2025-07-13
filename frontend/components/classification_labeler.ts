/* -------------------------------------------------------------------------- */

import { LabelButton } from './label_button.js';
import { IconButton } from './icon_button.js';

/* -------------------------------------------------------------------------- */

interface ClassificationLabelerAttributes {
    heading?: string
}

/* -------------------------------------------------------------------------- */

interface LabelSchema {
    name: string
}

/* -------------------------------------------------------------------------- */

interface ColoredSpan {
    start: number;
    end: number;
    color: string;
}

/* -------------------------------------------------------------------------- */

interface TextLabelSchema extends LabelSchema {
    start: number
    end: number
}

/* -------------------------------------------------------------------------- */

export class ClassificationLabeler extends HTMLElement implements ClassificationLabelerAttributes {
    public heading?: string = undefined;
    private _headerDiv: HTMLDivElement = document.createElement('div');
    private _buttonsDiv: HTMLDivElement = document.createElement('div');
    private _titleDiv: HTMLSpanElement = document.createElement('div');
    private _classificationContainer: HTMLDivElement = document.createElement('div');

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
            this._titleDiv.textContent = this.heading || "Label Element";
        }

        this._populateShadowRoot();
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        // ...
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
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                border: 1px solid var(--label-fragment-border-color);
                border-radius: var(--label-fragment-border-radius);
                display: grid;
                grid-auto-rows: min-content;
                user-select: none;
            }

            .header {
                align-items: center;
                background-color: var(--label-fragment-title-background-color);
                border-bottom: 1px solid var(--label-fragment-border-color);
                color: var(--label-fragment-title-color);
                display: grid;
                gap: 1rem;
                grid-template-columns: 1fr auto;
                padding: 0.5em;
            }

            .buttons {
                align-items: center;
                display: grid;
                gap: 0.5rem;
                grid-auto-columns: min-content;
                grid-auto-flow: column;
            }

            .title {
                font-weight: 500;
                font-size: 0.9rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .classification-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                padding: 0.5em;
            }
        `;

        this.shadowRoot?.appendChild(style);

        this._headerDiv.className = "header";
        this.shadowRoot?.appendChild(this._headerDiv);

        this._titleDiv.className = "title";
        this._titleDiv.textContent = this.heading || "Label Element";
        this._headerDiv.appendChild(this._titleDiv);

        this._buttonsDiv.className = "buttons";
        this._headerDiv.appendChild(this._buttonsDiv);

        this._classificationContainer.className = "classification-container";
        this.shadowRoot?.appendChild(this._classificationContainer);
    }

    /**
     * Adds a view button to the classification container.
     */
    public addViewButton(): HTMLElement {
        if (!this._classificationContainer) {
            throw new Error("Classification container is not initialized.");
        }

        const button = new IconButton();
        button.setAttribute("img", "/static/img/eye-outline.svg");
        button.ariaLabel = "View in document";

        this._buttonsDiv.appendChild(button);

        return (button);
    }

    /**
     * Adds a view button to the classification container.
     */
    public addCheckButton(): HTMLElement {
        if (!this._classificationContainer) {
            throw new Error("Classification container is not initialized.");
        }

        const button = new IconButton();
        button.setAttribute("img", "/static/img/square-outline.svg");
        button.ariaLabel = "Mark as done";

        this._buttonsDiv.appendChild(button);

        return (button);
    }

    /**
     * Adds a label button to the classification container.
     */
    public addLabelButton(
        name: string,
        color: string,
        type: 'classification_single' | 'classification_multiple' | 'text',
        active: boolean
    ): HTMLElement {
        if (!this._classificationContainer) {
            throw new Error("Classification container is not initialized.");
        }

        const button = new LabelButton();
        button.setAttribute("color", color);
        button.setAttribute("name", name);
        button.setAttribute("type", type);
        button.setAttribute("active", active.toString());
        button.ariaLabel = name;

        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;

        button.appendChild(span);

        this._classificationContainer.appendChild(button);

        return (button);
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('classification-labeler', ClassificationLabeler);

/* -------------------------------------------------------------------------- */