import { LabelButton } from './label_button.js';
import { IconButton } from './icon_button.js';
export class ClassificationLabeler extends HTMLElement {
    heading = undefined;
    done = false;
    _headerDiv = document.createElement('div');
    _buttonsDiv = document.createElement('div');
    _titleDiv = document.createElement('div');
    _classificationContainer = document.createElement('div');
    _checkButton = new IconButton();
    _style = document.createElement('style');
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['heading', 'done'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'heading') {
            this.heading = newValue || undefined;
            this._titleDiv.textContent = this.heading || "Label Element";
        }
        else if (propertyName === 'done') {
            this.done = newValue === 'true';
            this._updateStatus();
        }
    }
    connectedCallback() {
        this._populateShadowRoot();
        this._updateStatus();
    }
    disconnectedCallback() {
    }
    _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this._style.textContent = `
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
                border-top: 1px solid var(--label-fragment-border-color);
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                padding: 0.5em;
            }

            .done {
                display: none;
            }

            .classification-container:empty {
                display: none;
            }
        `;
        this.shadowRoot?.appendChild(this._style);
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
    addViewButton() {
        const button = new IconButton();
        button.setAttribute("img", "/static/img/eye-outline.svg");
        button.ariaLabel = "View in document";
        this._buttonsDiv.appendChild(button);
        return (button);
    }
    addCheckButton() {
        if (!this._checkButton) {
            throw new Error("Check button is not defined.");
        }
        this._buttonsDiv.appendChild(this._checkButton);
        return (this._checkButton);
    }
    addClassificationButton(name, color, type, active) {
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
    toggleDone() {
        if (!this._classificationContainer) {
            throw new Error("Classification container is not defined.");
        }
        if (!this._checkButton) {
            throw new Error("Check button is not defined.");
        }
        if (!this._classificationContainer.classList.contains('done')) {
            this._classificationContainer.classList.add('done');
            this._checkButton.setAttribute("img", "/static/img/checkbox-outline.svg");
            this._checkButton.ariaLabel = "Mark as not done";
            return true;
        }
        else {
            this._classificationContainer.classList.remove('done');
            this._checkButton.setAttribute("img", "/static/img/square-outline.svg");
            this._checkButton.ariaLabel = "Mark as done";
            return false;
        }
    }
    _updateStatus() {
        if (!this._checkButton)
            return;
        if (this.done) {
            this._classificationContainer.classList.add('done');
            this._checkButton.setAttribute("img", "/static/img/checkbox-outline.svg");
            this._checkButton.ariaLabel = "Mark as not done";
        }
        else {
            this._classificationContainer.classList.remove('done');
            this._checkButton.setAttribute("img", "/static/img/square-outline.svg");
            this._checkButton.ariaLabel = "Mark as done";
        }
    }
}
customElements.define('classification-labeler', ClassificationLabeler);
