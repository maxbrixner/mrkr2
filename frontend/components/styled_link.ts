interface StyledLinkAttributes {
    href: string;
    target?: string;
}

class StyledLink extends HTMLElement implements StyledLinkAttributes {
    public href: string = '';
    public target?: string = undefined;

    private _LinkElement: HTMLAnchorElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
            }
            a {
                text-decoration: none;
                color: var(--styled-link-color, #000000);;
                cursor: pointer;
            }
            a:hover,
            a:focus {
                outline: none;
                color: var(--styled-link-hover-color, #000000);
            }
        `;
        this.shadowRoot?.appendChild(style);

        this._LinkElement = document.createElement('a');
        this._LinkElement.appendChild(document.createElement('slot'));
        this.shadowRoot?.appendChild(this._LinkElement);
    }

    static get observedAttributes() {
        return ['href', 'target'];
    }

    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (!this._LinkElement) return;
        if (oldValue === newValue) return;

        if (newValue === null) {
            this._LinkElement.removeAttribute(propertyName);
            return;
        }

        this._LinkElement.setAttribute(propertyName, newValue);
    }

    connectedCallback() {
        //
    }

    disconnectedCallback() {
        //..
    }

}

customElements.define('styled-link', StyledLink);