export class StyledTextarea extends HTMLElement {
    _InputElement = document.createElement('textarea');
    get autocapitalize() {
        const value = this.getAttribute('autocapitalize');
        return value === 'none' || value === 'off' || value === 'on' || value === 'sentences' || value === 'words' ? value : 'none';
    }
    set autocapitalize(value) {
        this.setAttribute('autocapitalize', value);
    }
    get autocomplete() {
        const value = this.getAttribute('autocomplete');
        return value === 'on' || value === 'off' ? value : 'off';
    }
    set autocomplete(value) {
        this.setAttribute('autocomplete', value);
    }
    get disabled() {
        return this.hasAttribute('disabled');
    }
    set disabled(value) {
        if (value) {
            this.setAttribute('disabled', '');
        }
        else {
            this.removeAttribute('disabled');
        }
    }
    get type() {
        const type = this.getAttribute('type');
        return type === 'text' || type === 'password' || type === 'email' || type === 'number' || type === 'search' ? type : 'text';
    }
    set type(value) {
        this.setAttribute('type', value);
    }
    get placeholder() {
        return this.getAttribute('placeholder') || '';
    }
    set placeholder(value) {
        this.setAttribute('placeholder', String(value));
    }
    get spellcheck() {
        const value = this.getAttribute('spellcheck');
        return value === 'true' || value === 'false' ? value === 'true' : true;
    }
    set spellcheck(value) {
        this.setAttribute('spellcheck', String(value));
    }
    get value() {
        return this._InputElement.value;
    }
    set value(value) {
        this._InputElement.value = value;
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['autocapitalize', 'autocorrect', 'autocomplete', 'disabled', 'name', 'type', 'placeholder', 'spellcheck', 'value'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'autocapitalize') {
            this._InputElement.autocapitalize = newValue;
        }
        else if (propertyName === 'autocomplete') {
            this._InputElement.setAttribute('autocomplete', newValue || 'off');
        }
        else if (propertyName === 'disabled') {
            if (newValue !== null && newValue !== "false") {
                this.setAttribute('aria-disabled', 'true');
                this._InputElement.disabled = true;
                this._InputElement.setAttribute('aria-disabled', 'true');
            }
            else {
                this.removeAttribute('aria-disabled');
                this._InputElement.disabled = false;
                this._InputElement.removeAttribute('aria-disabled');
            }
        }
        else if (propertyName === 'placeholder') {
            this._InputElement.placeholder = newValue || '';
        }
        else if (propertyName === 'spellcheck') {
            this._InputElement.spellcheck = newValue === 'true';
        }
        else if (propertyName === 'value') {
            this._InputElement.value = newValue || '';
        }
    }
    connectedCallback() {
    }
    disconnectedCallback() {
    }
    _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
            }

            textarea {
                background-color: var(--styled-input-background-color, #ffffff);
                border-color: var(--styled-input-border-color, #000000);
                border-radius: var(--styled-input-border-radius, 0px);
                border-style: solid;
                border-width: var(--styled-input-border-width, 1px);
                box-sizing: border-box;
                color: var(--styled-input-color, #000000);
                font-family: inherit;
                font-size: var(--styled-input-font-size, 1rem);
                font-weight: var(--styled-input-font-weight, normal);
                height: 100%;
                outline: none;
                overflow: auto;
                padding: var(--styled-input-padding, 0.5rem 1rem);
                resize: none;
                scrollbar-color: var(--styled-input-scrollbar-color, inherit);
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                text-overflow: ellipsis;
                white-space: nowrap;
                width: 100%;
            }

            textarea:not(:disabled):focus {
                outline: var(--styled-input-focus-outline, 2px solid #000000);
            }

            textarea:disabled {
                background-color: var(--styled-input-background-color-disabled, #f0f0f0);
                border-color: var(--styled-input-border-color-disabled, #000000);
                color: var(--styled-input-color-disabled, #888888);
                cursor: not-allowed;
            }
        `;
        this.shadowRoot.appendChild(style);
        const slot = document.createElement('slot');
        this._InputElement.appendChild(slot);
        this.shadowRoot.appendChild(this._InputElement);
    }
}
customElements.define('styled-textarea', StyledTextarea);
