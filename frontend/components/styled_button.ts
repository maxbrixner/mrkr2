interface StyledButtonAttributes {
    autofocus?: boolean;
    disabled?: boolean;
    name?: string;
    type?: string;
}

class StyledButton extends HTMLElement implements StyledButtonAttributes {
    public disabled?: boolean = false;
    public name?: string = undefined;
    public type?: 'button' | 'submit' | 'reset' = 'button';

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
                background-color: var(--styled-button-background, #ffffff);
                border-color: var(--styled-button-border-color, #000000);
                border-radius: var(--styled-button-border-radius, 0px);
                border-width: var(--styled-button-border-width, 1px);
                color: var(--styled-button-color, #000000);
                outline: none;
                border-style: solid;
                font-weight: var(--styled-button-font-weight, normal);
                padding: var(--styled-button-padding, 0.5rem 1rem);
            }
            button:hover,
            button:focus {
                border-color: var(--styled-button-border-color-hover, #000000);
            }
        `;
        this.shadowRoot?.appendChild(style);

        this._ButtonElement = document.createElement('button');
        this._ButtonElement.type = this.type || 'button';
        this._ButtonElement.appendChild(document.createElement('slot'));
        this.shadowRoot?.appendChild(this._ButtonElement);
    }

    static get observedAttributes() {
        return ['autofocus', 'disabled', 'name', 'type'];
    }

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
            this._ButtonElement.disabled = newValue !== null;
        }
        if (propertyName === 'name') {
            this._ButtonElement.name = newValue || '';
        }
        if (propertyName === 'type') {
            if (newValue === 'button' || newValue === 'submit' || newValue === 'reset') {
                this._ButtonElement.type = newValue;
            } else {
                this._ButtonElement.type = 'button';
            }
        }
    }

    connectedCallback() {
        this.addEventListener('click', this._onClick);
    }

    private _onClick = (e: Event) => {
        if (e.target === this) {
            this._ButtonElement.click();
        }
    };

    disconnectedCallback() {
        //..
    }

}

customElements.define('styled-button', StyledButton);