import { getRelativeLuminance, hexToRgbAString } from '../utils/color_helpers.js';
export class LabelButton extends HTMLElement {
    _active = false;
    _color = '#000000';
    _type = '';
    _target = '';
    _targetType = "document";
    _ButtonElement = document.createElement('button');
    get active() {
        return this._active;
    }
    set active(value) {
        this.setAttribute('active', value ? 'true' : 'false');
    }
    get type() {
        return this._type;
    }
    set type(value) {
        this.setAttribute('type', value);
    }
    get target() {
        return this._target;
    }
    set target(value) {
        this.setAttribute('target', value);
    }
    get targetType() {
        return this._targetType;
    }
    set targetType(value) {
        this.setAttribute('target-type', value);
    }
    get disabled() {
        return this._ButtonElement.disabled === true || false;
    }
    set disabled(value) {
        this.setAttribute('disabled', value ? 'true' : 'false');
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this.setAttribute('color', value);
    }
    get name() {
        return this._ButtonElement.name || '';
    }
    set name(value) {
        this.setAttribute('name', value);
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
            }
            button {
                border: none;
                border-left-style: solid;
                border-left-width: 4px;
                border-radius: 3px;
                cursor: pointer;
                display: inline-grid;
                font-weight: 400;
                line-height: 22px;
                outline: none;
                padding: 0.2rem 1rem;
            }
            .active {
                color: #ffffff;
            }
            button:focus {
                outline: var(--label-button-focus-outline, 2px solid #000000);
            }
            button:disabled {
                cursor: not-allowed;
            }
        `;
        this.shadowRoot?.appendChild(style);
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
        if (oldValue === newValue)
            return;
        if (propertyName === 'color') {
            this._color = newValue || '#000000';
            this._updateColor();
        }
        else if (propertyName === 'active') {
            this._active = (newValue == "true") || false;
            this._updateColor();
        }
        else if (propertyName === 'disabled') {
            this._ButtonElement.disabled = newValue === 'true' ? true : false;
            this._updateColor();
        }
        else if (propertyName === 'name') {
            this._ButtonElement.name = newValue || '';
        }
        else if (propertyName === 'type') {
            this._type = newValue || '';
        }
        else if (propertyName === 'target') {
            this._target = newValue || '';
        }
        else if (propertyName === 'target-type') {
            this._targetType = newValue || "document";
        }
    }
    connectedCallback() {
        this.addEventListener('click', this._onClick.bind(this));
    }
    disconnectedCallback() {
        this.removeEventListener('click', this._onClick.bind(this));
    }
    _onClick(event) {
        if (this._ButtonElement.disabled)
            return;
        this.dispatchEvent(new CustomEvent('label-button-click', {
            detail: {
                button: this,
                name: this._ButtonElement.name,
                active: !this._active,
                type: this._type,
                target: this._target,
                targetType: this._targetType
            },
            bubbles: true,
            composed: true
        }));
    }
    _updateColor() {
        if (this._ButtonElement.disabled) {
            this._ButtonElement.style.borderColor = 'var(--label-button-border-color-disabled, #000000)';
            this._ButtonElement.style.backgroundColor = 'var(--label-button-background-color-disabled, #000000)';
            this._ButtonElement.style.color = 'var(--label-button-color-disabled, #000000)';
        }
        else if (this._active === true) {
            this._ButtonElement.style.borderColor = this._color;
            const color = hexToRgbAString(this._color, 1);
            const luminance = getRelativeLuminance(this._color, 1);
            const fontColor = luminance < 0.5 ? '#ffffff' : '#000000';
            this._ButtonElement.classList.add('active');
            this._ButtonElement.style.backgroundColor = color;
            this._ButtonElement.style.color = fontColor;
        }
        else {
            this._ButtonElement.style.borderColor = this._color;
            const color = hexToRgbAString(this._color, 0.2);
            const luminance = getRelativeLuminance(this._color, 0.2);
            const fontColor = luminance < 0.5 ? '#ffffff' : '#000000';
            this._ButtonElement.classList.remove('active');
            this._ButtonElement.style.backgroundColor = color;
            this._ButtonElement.style.color = fontColor;
        }
    }
}
customElements.define('label-button', LabelButton);
