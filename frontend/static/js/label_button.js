import { getRelativeLuminance, hexToRgbA } from './utils/color_helpers.js';
export class LabelButton extends HTMLElement {
    color = '#000000';
    disabled = false;
    name = undefined;
    active = false;
    type = undefined;
    target = undefined;
    targetType = undefined;
    _ButtonElement;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
            }
            button {
                color: #000000;
                border: none;
                outline: none;
                border-left-style: solid;
                border-left-width: 4px;
                border-radius: 3px;
                cursor: pointer;
                line-height: 22px;
                font-weight: 400;
                display: inline-grid;
                padding: 0.2rem 1rem;
            }
            .active {
                color: #ffffff;
            }
            button:focus {
                outline: 2px solid #000000;
            }
        `;
        this.shadowRoot?.appendChild(style);
        this._ButtonElement = document.createElement('button');
        this._ButtonElement.type = 'button';
        const labelSlot = document.createElement('slot');
        labelSlot.name = 'label';
        this._ButtonElement.appendChild(labelSlot);
        this.shadowRoot?.appendChild(this._ButtonElement);
    }
    static get observedAttributes() {
        return ['color', 'disabled', 'name', 'active', 'type', 'target', 'target-type'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (!this._ButtonElement)
            return;
        if (oldValue === newValue)
            return;
        if (propertyName === 'color') {
            this.color = newValue || '#000000';
            this._updateColor();
        }
        else if (propertyName === 'active') {
            this.active = (newValue == "true") || false;
            this._updateColor();
        }
        else if (propertyName === 'disabled') {
            this._ButtonElement.disabled = newValue !== null;
        }
        else if (propertyName === 'name') {
            this._ButtonElement.name = newValue || '';
            this.name = newValue || undefined;
        }
        else if (propertyName === 'type') {
            this.type = newValue || undefined;
        }
        else if (propertyName === 'target') {
            this.target = newValue || undefined;
        }
        else if (propertyName === 'target-type') {
            this.targetType = newValue || undefined;
        }
    }
    connectedCallback() {
        this.addEventListener('click', this._onClick.bind(this));
    }
    disconnectedCallback() {
        this.removeEventListener('click', this._onClick.bind(this));
    }
    _onClick(event) {
        if (this.disabled)
            return;
        this.dispatchEvent(new CustomEvent('label-button-click', {
            detail: {
                button: this,
                name: this.name,
                active: !this.active,
                type: this.type,
                target: this.target,
                targetType: this.targetType
            },
            bubbles: true,
            composed: true
        }));
    }
    _updateColor() {
        const backgroundColor = hexToRgbA(this.color, 0.2);
        const borderColor = hexToRgbA(this.color, 1);
        const luminance = getRelativeLuminance(borderColor);
        const fontColor = luminance < 0.5 ? '#ffffff' : '#00000';
        this._ButtonElement.style.borderColor = borderColor;
        if (this.active === true) {
            this._ButtonElement.classList.add('active');
            this._ButtonElement.style.backgroundColor = borderColor;
            this._ButtonElement.style.color = fontColor;
        }
        else {
            this._ButtonElement.classList.remove('active');
            this._ButtonElement.style.backgroundColor = backgroundColor;
            this._ButtonElement.style.color = "#000000";
        }
    }
}
customElements.define('label-button', LabelButton);
