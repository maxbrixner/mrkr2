/* -------------------------------------------------------------------------- */

import { IconButton, IconButtonAttributes } from './icon_button.js';

/* -------------------------------------------------------------------------- */

export interface MessageBoxAttributes {
    closeIcon?: string;
    hideAfter?: number;
    maxMessages?: number;
}

/* -------------------------------------------------------------------------- */

export class MessageBox extends HTMLElement implements MessageBoxAttributes {
    private _messages: HTMLDivElement[] = [];
    private _closeIcon?: string = undefined;
    private _hideAfter?: number = undefined;
    private _maxMessages?: number = undefined;

    get closeIcon() {
        return this._closeIcon || '';
    }

    set closeIcon(value: string) {
        this.setAttribute('close-icon', value);
    }

    get hideAfter() {
        return this._hideAfter || 5000;
    }

    set hideAfter(value: number) {
        if (value < 0) {
            throw new Error("hideAfter must be a non-negative number");
        }
        this.setAttribute('hide-after', value.toString());
    }

    get maxMessages() {
        return this._maxMessages || 5;
    }

    set maxMessages(value: number) {
        if (value < 1) {
            throw new Error("maxMessages must be at least 1");
        }
        this.setAttribute('max-messages', value.toString());
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['close-icon', 'max-messages', 'hide-after'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        if (propertyName === 'close-icon') {
            this._closeIcon = newValue || '';
        } else if (propertyName === 'hide-after') {
            this._hideAfter = newValue ? parseInt(newValue, 10) : undefined;
        } else if (propertyName === 'max-messages') {
            this._maxMessages = newValue ? parseInt(newValue, 10) : undefined;
        }
    }

    connectedCallback() {
        // ...
    }

    disconnectedCallback() {
        // ...
    }

    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                background-color: transparent;    
                display: grid;
                gap: .5rem;
                grid-auto-rows: min-content;
                left: 10%;
                position: fixed;
                right: 10%;
                top: 1rem;
                z-index: 10;
            }

            .message {
                border: 1px solid transparent;
                border-radius: 5px;
                box-shadow: var(--message-box-box-shadow, none);
                display: grid;
                font-size: var(--message-box-font-size, 1rem);
                grid-template-areas: "text button";
                grid-template-columns: 1fr min-content;
                padding: var(--message-box-padding, 1rem);
            }
        `;

        this.shadowRoot.appendChild(style);
    }

    public showMessage(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', details?: string) {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        if (this._messages.length >= (this._maxMessages || 5)) {
            this.shadowRoot.removeChild(this._messages[0]);
            this._messages.shift();
        }

        const messageElement = document.createElement('div');
        messageElement.innerHTML = message;
        messageElement.className = `message ${type}`;

        if (this._closeIcon) {
            const closeButton = new IconButton();
            closeButton.ariaLabel = 'Close message';

            closeButton.mode = 'inherit';
            closeButton.img = this._closeIcon || '';
            closeButton.filter = `var(--message-box-${type}-icon-filter, none)`;

            closeButton.addEventListener('click', () => {
                this.shadowRoot?.removeChild(messageElement);
                this._messages = this._messages.filter(msg => msg !== messageElement);
            }, { once: true });
            messageElement.appendChild(closeButton);
        }

        messageElement.style.backgroundColor = `var(--message-box-${type}-background-color, #ffffff)`;
        messageElement.style.color = `var(--message-box-${type}-color, #000000)`;
        messageElement.style.borderColor = `var(--message-box-${type}-border-color, #000000)`;

        this._messages.push(messageElement);
        this.shadowRoot.appendChild(messageElement);

        switch (type) {
            case 'success':
                if (details) {
                    console.log(`Details: ${details}`);
                }
                break;
            case 'info':
                if (details) {
                    console.info(`Details: ${details}`);
                }
                break;
            case 'warning':
                if (details) {
                    console.warn(`Details: ${details}`);
                }
                break;
            case 'error':
                if (details) {
                    console.error(`Details: ${details}`);
                }
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        if (this._hideAfter && this._hideAfter > 0) {
            setTimeout(() => {
                if (this.shadowRoot) {
                    try {
                        this.shadowRoot.removeChild(messageElement);
                    } catch (error) {
                        return
                    }
                }
            }, this._hideAfter);
        }
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('message-box', MessageBox);

/* -------------------------------------------------------------------------- */
