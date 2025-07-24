/* -------------------------------------------------------------------------- */

import { StyledButton } from './styled_button.js';

/* -------------------------------------------------------------------------- */

export interface RemoteListPopupAttributes {
    contentUrl?: string;
    idField?: string
    displayField?: string
}

/* -------------------------------------------------------------------------- */

export class RemoteListPopup extends HTMLElement implements RemoteListPopupAttributes {
    public contentUrl?: string = undefined;
    public idField?: string = undefined;
    public displayField?: string = undefined;
    private _modular = document.createElement('dialog');
    private _content = document.createElement('fieldset');
    private _buttons = document.createElement('div');

    private _currentSelection?: string;

    private _callback?: (selected: string | undefined) => void;

    private _cancelButton = new StyledButton();
    private _applyButton = new StyledButton();

    /**
     * Creates an instance of StyledButton.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    /**
     * Returns an array of attribute names that this component observes.
     */
    static get observedAttributes() {
        return ['content-url', 'id-field', 'display-field'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'content-url') {
            this.contentUrl = newValue || undefined;
        } else if (propertyName === 'id-field') {
            this.idField = newValue || undefined;
        } else if (propertyName === 'display-field') {
            this.displayField = newValue || undefined;
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        this._cancelButton.addEventListener("click", this._onCancelButtonClick.bind(this));
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        this._cancelButton.removeEventListener("click", this._onCancelButtonClick.bind(this));
    }

    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');

        style.textContent = `
            :host {
                
            }

            dialog:open {
                opacity: 1;
            }

            dialog {
                padding: 0;
                opacity: 0;
                outline: none;
                border: none;
                transition:
                    opacity 0.2s ease-out,
                    transform 0.2s ease-out,
                    overlay 0.2s ease-out allow-discrete,
                    display 0.2s ease-out allow-discrete;
                background-color: var(--surface-color); /* todo */
                display: grid;
                grid-template-rows: 1fr min-content;
                grid-template-areas:
                    "content"
                    "buttons";
            }

            @starting-style {
                dialog:open {
                    opacity: 0;
                }
            }

            dialog::backdrop {
                background-color: rgb(0 0 0 / 0%);
                transition:
                    display 0.2s allow-discrete,
                    overlay 0.2s allow-discrete,
                    background-color 0.2s;
            }

            dialog:open::backdrop {
                background-color: rgb(0 0 0 / 80%);
            }

            @starting-style {
                dialog:open::backdrop {
                    background-color: rgb(0 0 0 / 0%);
                }
            }

            .content {
                outline: none;
                border: none;
                width: 300px;
                height: 300px;
                display: grid;
                grid-template-columns: min-content 1fr;
                grid-auto-rows: min-content;
                padding: .5rem;
                gap: .5rem;
            }

           .content.loading::before {
                animation: spin 1s linear infinite;    
                border: 4px solid var(--spinner-color, #000000);
                border-radius: 50%; 
                border-top: 4px solid var(--spinner-color-top, #ffffff);
                content: "";
                display: block;
                height: 30px;
                margin: 2rem auto;
                width: 30px;
            }

            .buttons {
                display: flex;
                justify-content: end;
                align-items: center;
                gap: 1rem;
                padding: 1rem;    
                border-top: 1px solid var(--border-color);
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

        this._content.classList.add("content");
        this._buttons.classList.add("buttons");


        this._applyButton.textContent = "Apply";
        this._applyButton.setAttribute("mode", "primary");
        this._applyButton.setAttribute("disabled", "true");
        this._buttons.appendChild(this._applyButton);

        this._cancelButton.textContent = "Cancel";
        this._buttons.appendChild(this._cancelButton);

        this._content.textContent = "Content goes here"; // Placeholder content

        this._modular.appendChild(this._content);
        this._modular.appendChild(this._buttons);

        this.shadowRoot?.appendChild(this._modular);
    }

    public show(callback: (selected: string | undefined) => void) {
        this._callback = callback;
        this._clearContent();
        this._modular.showModal();
        this._updateContent();

        this._applyButton.addEventListener("click", this._onApplyButtonClick.bind(this), { once: true });
    }

    public hide() {
        this._modular.close();
    }

    private _onCancelButtonClick(event: Event) {
        this.hide();
    }

    private _onApplyButtonClick(event: Event) {
        if (this._callback)
            this._callback(this._currentSelection || undefined);
        this.hide();
    }

    private _clearContent() {
        this._content.innerHTML = '';
        this._content.classList.add('loading');
        this._applyButton.setAttribute("disabled", "true");
    }

    private _updateContent() {
        this._clearContent();

        this._queryContent()
            .then(content => {
                this._content.classList.remove('loading');

                if (!this.idField || !this.displayField)
                    throw new Error("idField or displayField not defined")

                for (const item of content) {
                    const itemElement = document.createElement('input');
                    itemElement.type = 'radio';
                    const id = item[this.idField];
                    itemElement.id = `remote-list-${id}`;
                    itemElement.name = 'remote-list-choice';
                    itemElement.classList.add('remote-list-item');
                    itemElement.value = id;

                    itemElement.addEventListener('change', (event) => {
                        this._currentSelection = id;
                        this._applyButton.removeAttribute("disabled");
                    });

                    this._content.appendChild(itemElement);

                    const labelElement = document.createElement('label');
                    labelElement.textContent = item[this.displayField];
                    labelElement.setAttribute('for', `remote-list-${id}`);
                    this._content.appendChild(labelElement);
                }

            })
            .catch(error => {
                this._content.classList.remove('loading');
                console.error("Failed to fetch content:", error); /* todo */
            });
    }

    /**
     * Queries the content of the table.
     */
    private async _queryContent(): Promise<any[]> {
        if (!this.contentUrl) {
            throw new Error("URL is not set for RemoteeListPopup component.");
        }

        var url = new URL(this.contentUrl);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Response status: ${response.status} `);
        }

        const content: any | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch table content`);
        }

        return content;
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('remote-list-popup', RemoteListPopup);

/* -------------------------------------------------------------------------- */
