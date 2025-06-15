interface StyledLinkAttributes extends HTMLElement {
    href: string;
    target?: string;
}

class StyledLink extends HTMLElement implements StyledLinkAttributes {
    private _href: string = '';
    private _target: string | undefined;
    private _linkElement: HTMLAnchorElement | null = null;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
            }
            a {
                text-decoration: none;
                color: inherit;
                cursor: pointer;
            }
            a:hover {
                text-decoration: underline;
            }
        `;

        this._linkElement = document.createElement('a');

        const slot = document.createElement('slot');
        this._linkElement.appendChild(slot);
        shadowRoot.appendChild(style);
        shadowRoot.appendChild(this._linkElement);
    }

    /*static get observedAttributes() {
        return ['href', 'target'];
    }

    // Callback when an observed attribute changes
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
        const linkElement = this.shadowRoot?.querySelector('a');
        if (!linkElement) return;

        if (name === 'href') {
            this._href = newValue || '';
            linkElement.href = this._href;
        } else if (name === 'target') {
            this._target = newValue || undefined;
            if (this._target) {
                linkElement.target = this._target;
            } else {
                linkElement.removeAttribute('target');
            }
        }
    }*/

    connectedCallback() {
        if (this._linkElement) {
            this._href = this.getAttribute('href') || '';
            this._target = this.getAttribute('target') || undefined;

            this._linkElement.href = this._href;
            if (this._target) {
                this._linkElement.target = this._target;
            }
        }
    }

    set href(value: string) {
        this.setAttribute('href', value);
    }

    get href(): string {
        return this._href;
    }

    /*set target(value: string | undefined) {
        if (value) {
            this.setAttribute('target', value);
        } else {
            this.removeAttribute('target');
        }
    }

    get target(): string | undefined {
        return this._target;
    }*/
}

customElements.define('styled-link', StyledLink);