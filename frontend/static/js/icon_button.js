import { StyledButton } from './styled_button.js';
export class IconButton extends StyledButton {
    img = '';
    _imgElement = document.createElement('img');
    constructor() {
        super();
        this._imgElement.alt = 'Icon';
        this._ButtonElement.classList.add('icon-button');
        this._ButtonElement.appendChild(this._imgElement);
    }
    static get observedAttributes() {
        return [...super.observedAttributes, 'img'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'img') {
            this._imgElement.src = newValue || '';
            this._updateStyle();
        }
    }
    _updateStyle() {
        super._updateStyle();
        this._style.textContent += `
            .icon-button {
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
    }
}
customElements.define('icon-button', IconButton);
