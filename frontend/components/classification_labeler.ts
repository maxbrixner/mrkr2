/* -------------------------------------------------------------------------- */

import { LabelButton } from './base/label_button.js';
import { IconButton } from './base/icon_button.js';

/* -------------------------------------------------------------------------- */

export interface ClassificationLabelerAttributes {
    heading?: string
    done?: boolean
    viewIcon?: string
    openIcon?: string
    doneIcon?: string
}

/* -------------------------------------------------------------------------- */

export class ClassificationLabeler extends HTMLElement implements ClassificationLabelerAttributes {
    protected _done: boolean = false;
    protected _viewIcon?: string = undefined;
    protected _openIcon?: string = undefined;
    protected _doneIcon?: string = undefined;
    protected _headerDiv: HTMLDivElement = document.createElement('div');
    protected _buttonsDiv: HTMLDivElement = document.createElement('div');
    protected _titleDiv: HTMLSpanElement = document.createElement('div');
    protected _classificationContainer: HTMLDivElement = document.createElement('div');
    protected _checkButton: IconButton = new IconButton();
    protected _viewButton: IconButton = new IconButton();
    protected _style: HTMLStyleElement = document.createElement('style');

    get heading(): string {
        return this._titleDiv.textContent || '';
    }

    set heading(value: string) {
        this.setAttribute('heading', value);
    }

    get done(): boolean {
        return this._done;
    }

    set done(value: boolean) {
        this.setAttribute('done', String(value));
    }

    get viewIcon(): string {
        return this._viewIcon || '';
    }

    set viewIcon(value: string) {
        this.setAttribute('view-icon', value);
    }

    get openIcon(): string {
        return this._openIcon || '';
    }

    set openIcon(value: string) {
        this.setAttribute('open-icon', value);
    }

    get doneIcon(): string {
        return this._doneIcon || '';
    }

    set doneIcon(value: string) {
        this.setAttribute('done-icon', value);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['heading', 'done', 'view-icon', 'open-icon', 'done-icon'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'heading') {
            this._titleDiv.textContent = newValue || "Label Element";
        } else if (propertyName === 'done') {
            this._done = newValue === 'true';
            this._updateStatus();
        } else if (propertyName === 'view-icon') {
            this._viewIcon = newValue || '';
            this._viewButton.setAttribute('img', this._viewIcon);
        } else if (propertyName === 'open-icon') {
            this._openIcon = newValue || '';
        } else if (propertyName === 'done-icon') {
            this._doneIcon = newValue || '';
        }
    }

    connectedCallback() {
        // ...
    }

    disconnectedCallback() {
        // ...
    }

    protected _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this._style.textContent = `
            :host {
                border: 1px solid var(--labeler-border-color);
                border-radius: var(--labeler-border-radius);
                display: grid;
                grid-auto-rows: min-content;
                user-select: none;
            }

            .header {
                align-items: center;
                display: grid;
                gap: 1rem;
                grid-template-columns: 1fr auto;
                padding: 0.5em;
                user-select: none;
            }

            .buttons {
                align-items: center;
                display: grid;
                gap: 0.5rem;
                grid-auto-columns: min-content;
                grid-auto-flow: column;
                user-select: none;
            }

            .title {
                font-weight: 500;
                font-size: 0.9rem;
                overflow: hidden;
                text-overflow: ellipsis;
                user-select: none;
                white-space: nowrap;
            }

            .classification-container {
                border-top: 1px solid var(--labeler-border-color);
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                padding: 0.5em;
                user-select: none;
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
        this._headerDiv.appendChild(this._titleDiv);

        this._buttonsDiv.className = "buttons";
        this._headerDiv.appendChild(this._buttonsDiv);

        this._classificationContainer.className = "classification-container";
        this.shadowRoot?.appendChild(this._classificationContainer);
    }

    public addViewButton(): HTMLElement {
        this._viewButton.setAttribute("img", this._viewIcon || '');
        this._viewButton.ariaLabel = "View in document";

        this._buttonsDiv.appendChild(this._viewButton);

        return (this._viewButton);
    }

    public addCheckButton(): HTMLElement {
        this._updateStatus();

        this._buttonsDiv.appendChild(this._checkButton);

        return (this._checkButton);
    }

    public addClassificationButton(name: string, color: string, type: 'classification_single' | 'classification_multiple', active: boolean): HTMLElement {
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

    protected _updateStatus(): void {
        if (this._done) {
            this._classificationContainer.classList.add('done');
            this._checkButton.setAttribute("img", this._doneIcon || '');
            this._checkButton.ariaLabel = "Mark as not done";
        } else {
            this._classificationContainer.classList.remove('done');
            this._checkButton.setAttribute("img", this._openIcon || '');
            this._checkButton.ariaLabel = "Mark as done";
        }
    }

    public disableButtons(): void {
        const buttons = this._classificationContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.setAttribute("disabled", "true");
            }
        });
    }

    public enableButtons(): void {
        const buttons = this._classificationContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.removeAttribute("disabled");
            }
        });
    }

    public clearLabelList(): void {
        const buttons = this._classificationContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.setAttribute("active", 'false');
            }
        });
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('classification-labeler', ClassificationLabeler);

/* -------------------------------------------------------------------------- */