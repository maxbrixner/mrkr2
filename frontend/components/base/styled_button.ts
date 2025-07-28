/* -------------------------------------------------------------------------- */

export interface StyledButtonAttributes {
    disabled?: boolean;
    mode?: 'default' | 'primary' | 'inherit';
    display?: 'inline-block' | 'block';
}

/* -------------------------------------------------------------------------- */

export class StyledButton extends HTMLElement implements StyledButtonAttributes {
    protected _style: HTMLStyleElement = document.createElement('style');
    protected _buttonElement: HTMLButtonElement = document.createElement('button');
    protected _slotElement: HTMLSlotElement = document.createElement('slot');

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value: boolean) {
        if (value) {
            this.setAttribute('disabled', '');;
        } else {
            this.removeAttribute('disabled');
        }
    }

    get mode() {
        const mode = this.getAttribute('mode');
        return (mode === 'default' || mode === 'primary' || mode === 'inherit') ? mode : 'default';
    }

    set mode(value: 'default' | 'primary' | 'inherit') {
        this.setAttribute('mode', value);
    }

    get display() {
        const display = this.getAttribute('display');
        return (display === 'inline-block' || display === 'block') ? display : 'inline-block';
    }

    set display(value: 'inline-block' | 'block') {
        this.setAttribute('display', value);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['disabled', 'mode', 'display'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'disabled') {
            if (newValue !== null && newValue !== "false") {
                this.setAttribute('aria-disabled', 'true');
                this._buttonElement.disabled = true;
                this._buttonElement.setAttribute('aria-disabled', 'true');
            } else {
                this.removeAttribute('aria-disabled');
                this._buttonElement.disabled = false;
                this._buttonElement.removeAttribute('aria-disabled');
            }
        } else if (propertyName === 'mode') {
            this._updateStyle();
        } else if (propertyName === 'display') {
            this.style.display = newValue || 'inline-block';
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

        const style = document.createElement('style');
        style.textContent = `
            :host {
                /* ... */
            }

            button {
                border-radius: var(--styled-button-border-radius, 0px);
                border-style: solid;
                border-width: var(--styled-button-border-width, 1px);
                font-family: inherit;
                font-size: var(--styled-button-font-size, 1rem);
                font-weight: var(--styled-button-font-weight, normal);
                outline: none;
                overflow: hidden;
                padding: var(--styled-button-padding, 0.5rem 1rem);
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            button:disabled {
                background-color: var(--styled-button-background-color-disabled, #f0f0f0);
                border-color: var(--styled-button-border-color-disabled, #000000);
                color: var(--styled-button-color-disabled, #888888);
                cursor: not-allowed;
            }
        `;

        this.shadowRoot.appendChild(style);

        this._updateStyle();
        this.shadowRoot.appendChild(this._style);

        this._buttonElement.type = 'button';
        this._buttonElement.appendChild(this._slotElement);
        this.shadowRoot.appendChild(this._buttonElement);
    }

    protected _updateStyle() {
        switch (this.mode) {
            case 'primary':
                this._style.textContent = `
                button {
                    background-color: var(--styled-button-background-color-primary, #ffffff);
                    border-color: var(--styled-button-border-color-primary, #000000);
                    color: var(--styled-button-color-primary, #000000);
                }

                button:not(:disabled):hover,
                button:not(:disabled):focus {
                    border-color: var(--styled-button-border-color-hover-primary, #000000);
                }
            `;
                break;
            case 'inherit':
                this._style.textContent = `
                button {
                    background-color: inherit;
                    border-color: transparent;
                    color: inherit;
                }

                button:not(:disabled):hover,
                button:not(:disabled):focus {
                    border-color: inherit;
                }
            `;
                break;
            default:
                this._style.textContent = `
                    button {
                        background-color: var(--styled-button-background-color, #ffffff);
                        border-color: var(--styled-button-border-color, #000000);
                        color: var(--styled-button-color, #000000);
                    }

                    button:not(:disabled):hover,
                    button:not(:disabled):focus {
                        border-color: var(--styled-button-border-color-hover, #000000);
                    }
                `;
                break;
        }
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('styled-button', StyledButton);

/* -------------------------------------------------------------------------- */
