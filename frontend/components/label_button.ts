interface LabelButtonAttributes {
    color: string;
    disabled?: boolean;
    name?: string;
    active?: boolean;
    type?: string;
    target?: string;
    targetType?: "document" | "page" | "block";
}

export class LabelButton extends HTMLElement implements LabelButtonAttributes {
    public color: string = '#000000';
    public disabled?: boolean = false;
    public name?: string = undefined;
    public active?: boolean = false;
    public type?: string = undefined;
    public target?: string = undefined;
    public targetType?: "document" | "page" | "block" = undefined;
    private _ButtonElement: HTMLButtonElement;

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

    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (!this._ButtonElement) return;
        if (oldValue === newValue) return;
        if (propertyName === 'color') {
            this.color = newValue || '#000000';
            this._updateColor();
        } else if (propertyName === 'active') {
            this.active = (newValue == "true") || false;
            this._updateColor();
        } else if (propertyName === 'disabled') {
            this._ButtonElement.disabled = newValue !== null;
        } else if (propertyName === 'name') {
            this._ButtonElement.name = newValue || '';
            this.name = newValue || undefined;
        } else if (propertyName === 'type') {
            this.type = newValue || undefined;
        } else if (propertyName === 'target') {
            this.target = newValue || undefined;
        } else if (propertyName === 'target-type') {
            this.targetType = newValue as "document" | "page" | "block" || undefined;
        }
    }

    connectedCallback() {
        this.addEventListener('click', this._onClick.bind(this));
    }

    private _onClick(event: MouseEvent) {
        if (this.disabled) return;

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

    private _updateColor() {
        const backgroundColor = this._hexToRgbA(this.color, 0.2);
        const borderColor = this._hexToRgbA(this.color, 1);
        const luminance = this._getRelativeLuminance(borderColor);
        // Ensure the font color is readable against the background
        // If the luminance is low, use a light color, otherwise use a dark color
        const fontColor = luminance < 0.5 ? '#ffffff' : '#00000'
        this._ButtonElement.style.borderColor = borderColor;
        if (this.active === true) {
            this._ButtonElement.classList.add('active');
            this._ButtonElement.style.backgroundColor = borderColor;
            this._ButtonElement.style.color = fontColor;
        } else {
            this._ButtonElement.classList.remove('active');
            this._ButtonElement.style.backgroundColor = backgroundColor;
            this._ButtonElement.style.color = "#000000";
        }
    }

    private _hexToRgbA(hex: string, alpha: number = 1): string {
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let c = hex.substring(1);
            if (c.length === 3) {
                c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            }
            const num = parseInt(c, 16);
            let r = (num >> 16) & 255;
            let g = (num >> 8) & 255;
            let b = num & 255;
            return 'rgba('
                + [r, g, b].join(',')
                + ', ' + alpha + ')';
        }
        throw new Error('Color must be in hex format');
    }

    /**
     * Calculates the relative luminance of an RGB color.
     * The formula is based on WCAG 2.1 guidelines.
     * @param r Red component (0-255).
     * @param g Green component (0-255).
     * @param b Blue component (0-255).
     * @returns The relative luminance (0-1).
     */
    private _getRelativeLuminance(color: string): number {
        //get r,g,b from rgba(r,g,b,a) string
        const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!rgba) {
            throw new Error('Invalid color format. Expected rgba(r,g,b,a) or rgb(r,g,b)');
        }
        const r = parseInt(rgba[1], 10);
        const g = parseInt(rgba[2], 10);
        const b = parseInt(rgba[3], 10);
        const sRGB = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }

    disconnectedCallback() {
        this.removeEventListener('click', this._onClick.bind(this));
    }

}

customElements.define('label-button', LabelButton);