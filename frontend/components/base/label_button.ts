/* -------------------------------------------------------------------------- */

import { getRelativeLuminance, hexToRgbAString } from '../utils/color_helpers.js';

/* -------------------------------------------------------------------------- */

interface LabelButtonAttributes {
    color: string;
    disabled?: boolean;
    name?: string;
    active?: boolean;
    type?: string;
    target?: string;
    targetType?: "document" | "page" | "block";
}

/* -------------------------------------------------------------------------- */

export class LabelButton extends HTMLElement implements LabelButtonAttributes {
    private _active: boolean = false;
    private _color: string = '#000000';
    private _type: string = '';
    private _target: string = '';
    private _targetType: "document" | "page" | "block" = "document";
    private _ButtonElement: HTMLButtonElement = document.createElement('button');

    get active(): boolean {
        return this._active;
    }

    set active(value: boolean) {
        this.setAttribute('active', value ? 'true' : 'false');
    }

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this.setAttribute('type', value);
    }

    get target(): string {
        return this._target;
    }

    set target(value: string) {
        this.setAttribute('target', value);
    }

    get targetType(): "document" | "page" | "block" {
        return this._targetType;
    }

    set targetType(value: "document" | "page" | "block") {
        this.setAttribute('target-type', value);
    }

    get disabled(): boolean {
        return this._ButtonElement.disabled === true || false;
    }

    set disabled(value: boolean) {
        this.setAttribute('disabled', value ? 'true' : 'false');
    }

    get color(): string {
        return this._color;
    }

    set color(value: string) {
        this.setAttribute('color', value);
    }

    get name(): string {
        return this._ButtonElement.name || '';
    }

    set name(value: string) {
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

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'color') {
            this._color = newValue || '#000000';
            this._updateColor();
        } else if (propertyName === 'active') {
            this._active = (newValue == "true") || false;
            this._updateColor();
        } else if (propertyName === 'disabled') {
            this._ButtonElement.disabled = newValue === 'true' ? true : false;
            this._updateColor();
        } else if (propertyName === 'name') {
            this._ButtonElement.name = newValue || '';
        } else if (propertyName === 'type') {
            this._type = newValue || '';
        } else if (propertyName === 'target') {
            this._target = newValue || '';
        } else if (propertyName === 'target-type') {
            this._targetType = newValue as "document" | "page" | "block" || "document";
        }
    }

    connectedCallback() {
        this.addEventListener('click', this._onClick.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListener('click', this._onClick.bind(this));
    }

    private _onClick(event: MouseEvent) {
        if (this._ButtonElement.disabled) return;

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

    private _updateColor() {
        if (this._ButtonElement.disabled) {
            this._ButtonElement.style.borderColor = 'var(--label-button-border-color-disabled, #000000)';
            this._ButtonElement.style.backgroundColor = 'var(--label-button-background-color-disabled, #000000)';
            this._ButtonElement.style.color = 'var(--label-button-color-disabled, #000000)';
        } else if (this._active === true) {
            this._ButtonElement.style.borderColor = this._color;
            const color = hexToRgbAString(this._color, 1);
            const luminance = getRelativeLuminance(this._color, 1);
            const fontColor = luminance < 0.5 ? '#ffffff' : '#000000'
            this._ButtonElement.classList.add('active');
            this._ButtonElement.style.backgroundColor = color;
            this._ButtonElement.style.color = fontColor;
        } else {
            this._ButtonElement.style.borderColor = this._color;
            const color = hexToRgbAString(this._color, 0.2);
            const luminance = getRelativeLuminance(this._color, 0.2);
            const fontColor = luminance < 0.5 ? '#ffffff' : '#000000'
            this._ButtonElement.classList.remove('active');
            this._ButtonElement.style.backgroundColor = color;
            this._ButtonElement.style.color = fontColor;
        }
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('label-button', LabelButton);

/* -------------------------------------------------------------------------- */