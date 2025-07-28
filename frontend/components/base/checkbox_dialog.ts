/* -------------------------------------------------------------------------- */

import { StyledDialog, StyledDialogAttributes } from './styled_dialog.js';
import { StyledButton } from './styled_button.js';

/* -------------------------------------------------------------------------- */

export interface CheckboxDialogAttributes extends StyledDialogAttributes {
    contentUrl?: string;
    idField?: string
    displayField?: string
}

/* -------------------------------------------------------------------------- */

export class CheckboxDialog extends StyledDialog implements CheckboxDialogAttributes {
    protected _contentUrl: string | undefined;
    protected _idField: string | undefined;
    protected _displayField: string | undefined;
    protected _confirmButton = new StyledButton();

    private _currentSelection?: string = undefined;

    get contentUrl() {
        return this._contentUrl;
    }

    set contentUrl(value: string | undefined) {
        this.setAttribute('content-url', value || '');
    }

    get idField() {
        return this._idField;
    }

    set idField(value: string | undefined) {
        this.setAttribute('id-field', value || '')
    }

    get displayField() {
        return this._displayField;
    }

    set displayField(value: string | undefined) {
        this.setAttribute('display-field', value || '')
    }

    constructor() {
        super();

        this._populateChildShadowRoot();
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'content-url', 'id-field', 'display-field'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);

        if (propertyName === 'content-url') {
            this._contentUrl = newValue || '';
        } else if (propertyName === 'id-field') {
            this._idField = newValue || '';
        } else if (propertyName === 'display-field') {
            this._displayField = newValue || '';
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    private _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');
        style.textContent = `
            .content {
                display: grid;
                grid-template-columns: min-content 1fr;
                grid-auto-rows: min-content;
                grid-auto-flow: row;
            }
        `
        this.shadowRoot?.appendChild(style);

        this._confirmButton.textContent = 'Confirm';
        this._confirmButton.mode = 'primary';
        this._buttons.insertBefore(this._confirmButton, this._cancelButton);
    }

    public showModal() {
        this._clearContent();
        this._updateContent();
        super.showModal();
    }

    private _clearContent() {
        this._content.innerHTML = '';
        this._content.classList.remove('error');
        this._content.classList.add('loading');
        this._confirmButton.setAttribute("disabled", "true");
    }

    private _updateContent() {
        this._clearContent();

        this._queryContent()
            .then(content => {
                this._content.classList.remove('loading');

                if (!this.idField || !this.displayField)
                    throw new Error("idField or displayField not defined");

                for (const item of content) {
                    if (!(this.idField in item) || !(this.displayField in item)) {
                        throw new Error("idField or displayField not present");
                    }

                    const itemElement = document.createElement('input');
                    itemElement.type = 'radio';
                    const id = item[this.idField];
                    itemElement.id = `remote-list-${id}`;
                    itemElement.name = 'remote-list-choice';
                    itemElement.classList.add('remote-list-item');
                    itemElement.value = id;

                    itemElement.addEventListener('change', (event) => {
                        this._currentSelection = id;
                        this._confirmButton.removeAttribute("disabled");
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
                this._content.classList.add('error');
                console.error("Error fetching dialog content:", error);
            });
    }

    private async _queryContent(): Promise<any[]> {
        if (!this._contentUrl) {
            throw new Error("URL is not set for CheckboxDialog component.");
        }

        var url = new URL(this._contentUrl);
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

customElements.define('checkbox-dialog', CheckboxDialog);

/* -------------------------------------------------------------------------- */
