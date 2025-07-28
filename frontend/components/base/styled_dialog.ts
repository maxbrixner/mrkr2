/* -------------------------------------------------------------------------- */

import { StyledButton } from './styled_button.js';

/* -------------------------------------------------------------------------- */

export interface StyledDialogAttributes {
    heading?: string;
}

/* -------------------------------------------------------------------------- */

export class StyledDialog extends HTMLElement implements StyledDialogAttributes {
    protected _dialog = document.createElement('dialog');
    protected _header = document.createElement('div');
    protected _content = document.createElement('div');
    protected _buttons = document.createElement('div');
    protected _cancelButton = new StyledButton();

    protected _contentSlot = document.createElement('slot');
    protected _buttonsSlot = document.createElement('slot');

    get heading() {
        return this._header.textContent || '';
    }

    set heading(value: string) {
        this.setAttribute('heading', value);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['heading'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'heading') {
            this._header.textContent = newValue || '';
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
                height: 0;
                left: 0;    
                position: fixed;
                top: 0;
                visibility: hidden;
                width: 0;
            }

            dialog:open {
                opacity: 1;
            }

            dialog {
                border: none;  
                display: grid; 
                grid-template-rows: min-content 1fr min-content;
                grid-template-areas:
                    "header"
                    "content"
                    "buttons"; 
                opacity: 0;
                outline: none;
                padding: 0;
                transition:
                    display 0.2s ease-out allow-discrete,
                    opacity 0.2s ease-out,
                    overlay 0.2s ease-out allow-discrete,
                    transform 0.2s ease-out;
            }

            @starting-style {
                dialog:open {
                    opacity: 0;
                }
            }

            dialog::backdrop {
                background-color: rgb(0 0 0 / 0%);
                transition:
                    background-color 0.2s,
                    display 0.2s allow-discrete,
                    overlay 0.2s allow-discrete;
            }

            dialog:open::backdrop {
                background-color: rgb(0 0 0 / 80%);
            }

            @starting-style {
                dialog:open::backdrop {
                    background-color: rgb(0 0 0 / 0%);
                }
            }

            .header {
                border-bottom: 1px solid var(--styled-dialog-border-color, #000000);
                grid-area: header;
                padding: var(--styled-dialog-header-padding, 1rem);
                user-select: none;
            }

            .content {
                border: none;
                gap: .5rem;
                grid-area: content;
                max-height: 80%;
                max-width: 80%;
                min-height: 15rem;
                min-width: 15rem;
                outline: none;
                overflow-y: auto;
                padding: var(--styled-dialog-content-padding, 1rem);
                scrollbar-color: var(--scrollbar-color, inherit);
                scrollbar-gutter: stable;
                scrollbar-width: var(--scrollbar-width, inhterit);
            }

           .content.loading::before {
                animation: spin 1s linear infinite;    
                border: var(--spinner-border-large) solid var(--spinner-color, #000000);
                border-radius: 50%; 
                border-top: var(--spinner-border-large) solid var(--spinner-color-top, #ffffff);
                content: "";
                display: block;
                height: var(--spinner-size-large, 30px);
                margin: 2rem auto;
                width: var(--spinner-size-large, 30px);
            }
            
            .content.error::before {
                color: var(--styled-dialog-error-color, #000000);
                content: var(--styled-dialog-error-message, 'Error loading content');
                display: block;
                font-size: var(--styled-dialog-error-font-size, 1rem);
                margin: 2rem auto;
                text-align: center;
            }

            .buttons {
                align-items: center;
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 1rem;
                grid-area: buttons;
                justify-content: end;
                padding: var(--styled-dialog-buttons-padding, 1rem);
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }
        `
        this.shadowRoot?.appendChild(style);

        this._header.classList.add("header");
        this._content.classList.add("content");
        this._buttons.classList.add("buttons");

        this._contentSlot.name = 'content';
        this._content.appendChild(this._contentSlot);

        this._cancelButton.textContent = 'Cancel';
        this._cancelButton.addEventListener('click', this._onCancelButtonClick.bind(this));
        this._buttons.appendChild(this._cancelButton);

        this._buttonsSlot.name = 'buttons';
        this._buttons.appendChild(this._buttonsSlot);

        this._dialog.appendChild(this._header);
        this._dialog.appendChild(this._content);
        this._dialog.appendChild(this._buttons);

        this.shadowRoot?.appendChild(this._dialog);
    }

    public showModal() {
        (this._dialog as any).showModal();
    }

    public close() {
        (this._dialog as any).close();
    }

    protected _onCancelButtonClick(event: Event) {
        this.close();
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('styled-dialog', StyledDialog);

/* -------------------------------------------------------------------------- */
