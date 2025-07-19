/* -------------------------------------------------------------------------- */

export interface StyledButtonAttributes {
    autofocus?: boolean;
    disabled?: boolean;
    id?: string;
    mode?: 'default' | 'primary' | 'secondary' | 'danger';
    name?: string;
    type?: string;
}

/* -------------------------------------------------------------------------- */

export class StyledButton extends HTMLElement implements StyledButtonAttributes {
    public disabled?: boolean = false;
    public mode?: 'default' | 'primary' | 'secondary' | 'danger' = 'default';
    public name?: string = undefined;
    public type?: 'button' | 'submit' | 'reset' = 'button';

    protected _style: HTMLStyleElement = document.createElement('style');
    protected _ButtonElement: HTMLButtonElement = document.createElement('button');

    /**
     * Creates an instance of StyledButton.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._updateStyle();

        this.shadowRoot?.appendChild(this._style);

        this._ButtonElement.type = this.type || 'button';
        this._ButtonElement.appendChild(document.createElement('slot'));
        this.shadowRoot?.appendChild(this._ButtonElement);
    }

    /**
     * Returns an array of attribute names that this component observes.
     */
    static get observedAttributes() {
        return ['autofocus', 'disabled', 'name', 'type', 'mode'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (!this._ButtonElement) return;
        if (oldValue === newValue) return;
        if (propertyName === 'autofocus') {
            this._ButtonElement.autofocus = newValue !== null;
        }
        if (propertyName === 'disabled') {
            console.log("Disabled attribute changed:", newValue);
            this._ButtonElement.disabled = newValue !== null && newValue !== "false";
        }
        if (propertyName === 'name') {
            this._ButtonElement.name = newValue || '';
        }
        if (propertyName === 'id') {
            this._ButtonElement.id = newValue || '';
        }
        if (propertyName === 'mode') {
            this.mode = newValue as 'default' | 'primary' | 'secondary' | 'danger' || 'default';
            this._updateStyle();
        }
        if (propertyName === 'type') {
            if (newValue === 'button' || newValue === 'submit' || newValue === 'reset') {
                this._ButtonElement.type = newValue;
            } else {
                this._ButtonElement.type = 'button';
            }
        }

    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        // ...
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        // ...
    }

    /**
     * Updates the style of the button based on its mode and other attributes.
     */
    protected _updateStyle() {
        this._style.textContent = `
            :host {
                display: block;
            }

            button {
                border-radius: var(--styled-button-border-radius, 0px);
                border-width: var(--styled-button-border-width, 1px);
                outline: none;
                border-style: solid;
                font-weight: var(--styled-button-font-weight, normal);
                padding: var(--styled-button-padding, 0.5rem 1rem);
                font-family: inherit;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            button:disabled {
                border-color: var(--styled-button-border-color-disabled, #000000);
                background-color: var(--styled-button-background-disabled, #f0f0f0);
                color: var(--styled-button-color-disabled, #888888);
                cursor: not-allowed;
            }

            button:disabled:hover {
                border-color: var(--styled-button-border-color-disabled, #000000);
            }

        `;

        if (this.mode === 'default') {
            this._style.textContent += `
                button {
                    background-color: var(--styled-button-background-color, #ffffff);
                    border-color: var(--styled-button-border-color, #000000);
                    color: var(--styled-button-color, #000000);
                }

                button:hover,
                button:focus {
                    border-color: var(--styled-button-border-color-hover, #000000);
                }
            `;
        } else if (this.mode === 'primary') {
            this._style.textContent += `
                button {
                    background-color: var(--styled-button-background-color-primary, #ffffff);
                    border-color: var(--styled-button-border-color-primary, #000000);
                    color: var(--styled-button-color-primary, #000000);
                }

                button:hover,
                button:focus {
                    border-color: var(--styled-button-border-color-hover-primary, #000000);
                }
            `;
        }
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('styled-button', StyledButton);

/* -------------------------------------------------------------------------- */
