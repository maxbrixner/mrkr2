/* -------------------------------------------------------------------------- */

import { StyledButton, StyledButtonAttributes } from './styled_button.js';

/* -------------------------------------------------------------------------- */

export interface IconButtonAttributes extends StyledButtonAttributes {
    img: string;
    filter?: string;
}

/* -------------------------------------------------------------------------- */

export class IconButton extends StyledButton implements IconButtonAttributes {
    private _imgElement?: HTMLImageElement;

    get img() {
        return this.getAttribute('img') || '';
    }

    set img(value: string) {
        this.setAttribute('img', value);
    }

    get filter() {
        return this.getAttribute('filter') || 'none';
    }

    set filter(value: string) {
        this.setAttribute('filter', value);
    }

    constructor() {
        super();

        this._childPopulateShadowRoot();
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'img', 'filter'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'img') {
            if (this._imgElement) {
                this._imgElement.src = newValue || '';
            }
        } else if (propertyName === 'filter') {
            if (this._imgElement) {
                this._imgElement.style.filter = newValue || 'none';
            }
        }
    }

    protected _childPopulateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');
        style.textContent += `
            button {
                display: grid;
                grid-template-columns: min-content 1fr;
                grid-template-rows: 1fr;
                padding: 0.2rem;
            }

            img {
                height: 16px;
                margin: 0;
                padding: 0;
                width: 16px;
            }
        `;

        this.shadowRoot.appendChild(style);

        this._imgElement = document.createElement('img');
        this._imgElement.src = this.img;
        this._imgElement.alt = 'Icon';
        this._imgElement.style.filter = this.filter;
        this._slotElement?.appendChild(this._imgElement);
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('icon-button', IconButton);

/* -------------------------------------------------------------------------- */