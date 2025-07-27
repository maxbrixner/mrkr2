import { StyledButton } from './styled_button.js';
export class IconButton extends StyledButton {
    _imgElement;
    get img() {
        return this.getAttribute('img') || '';
    }
    set img(value) {
        this.setAttribute('img', value);
    }
    constructor() {
        super();
        this._childPopulateShadowRoot();
    }
    static get observedAttributes() {
        return [...super.observedAttributes, 'img'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'img') {
            if (this._imgElement) {
                this._imgElement.src = newValue || '';
            }
        }
    }
    _childPopulateShadowRoot() {
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
                width: 16px;
                height: 16px;
            }
        `;
        this.shadowRoot?.appendChild(style);
        this._imgElement = document.createElement('img');
        this._imgElement.src = this.img;
        this._imgElement.alt = 'Icon';
        this._slotElement?.appendChild(this._imgElement);
    }
}
customElements.define('icon-button', IconButton);
