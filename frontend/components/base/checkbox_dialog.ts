/* -------------------------------------------------------------------------- */

import { StyledDialog, StyledDialogAttributes } from './styled_dialog.js';
import { StyledButton } from './styled_button.js';

/* -------------------------------------------------------------------------- */

export interface CheckboxDialogAttributes extends StyledDialogAttributes {
    contentUrl?: string;
}

/* -------------------------------------------------------------------------- */

export class CheckboxDialog extends StyledDialog implements CheckboxDialogAttributes {
    protected _contentUrl: string | undefined;
    protected _confirmButton = new StyledButton();

    get contentUrl() {
        return this._contentUrl;
    }

    set contentUrl(value: string | undefined) {
        this.setAttribute('content-url', value || '');
    }

    constructor() {
        super();

        this._populateChildShadowRoot();
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'content-url'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);

        if (propertyName === 'content-url') {
            this._contentUrl = newValue || '';
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
        `
        this.shadowRoot?.appendChild(style);

        this._confirmButton.textContent = 'Confirm';
        this._confirmButton.mode = 'primary';
        this._buttons.insertBefore(this._confirmButton, this._cancelButton);
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('checkbox-dialog', CheckboxDialog);

/* -------------------------------------------------------------------------- */
