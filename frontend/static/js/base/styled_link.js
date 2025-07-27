export class StyledLink extends HTMLElement {
    _LinkElement = document.createElement('a');
    get href() {
        return this.getAttribute('href') || '';
    }
    set href(value) {
        this.setAttribute('href', value);
    }
    get target() {
        return this.getAttribute('target') || '';
    }
    set target(value) {
        this.setAttribute('target', value);
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['href', 'target'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'href') {
            this._LinkElement.href = newValue || '';
        }
        else if (propertyName === 'target') {
            this._LinkElement.target = newValue || '';
        }
    }
    connectedCallback() {
    }
    disconnectedCallback() {
    }
    _populateShadowRoot() {
        if (this.shadowRoot === null) {
            throw new Error('Shadow Root is not initialized.');
        }
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
            }
            a {
                color: var(--styled-link-color, #000000);;
                cursor: pointer;
                font-size: var(--styled-link-font-size, 1rem);
                text-decoration: none;
            }
            a:hover,
            a:focus {
                color: var(--styled-link-hover-color, #000000);
                outline: none;
            }
        `;
        this.shadowRoot?.appendChild(style);
        this._LinkElement.appendChild(document.createElement('slot'));
        this.shadowRoot?.appendChild(this._LinkElement);
    }
}
customElements.define('styled-link', StyledLink);
