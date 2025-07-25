"use strict";
class HamburgerButton extends HTMLElement {
    constructor() {
        super();
        this.isOpen = false;
        this.buttonElement = null;
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        var _a;
        this.render();
        this.buttonElement = ((_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('button')) || null;
        if (this.buttonElement) {
            this.buttonElement.addEventListener('click', this.toggleMenu.bind(this));
        }
    }
    disconnectedCallback() {
        if (this.buttonElement) {
            this.buttonElement.removeEventListener('click', this.toggleMenu.bind(this));
        }
    }
    render() {
        this.shadowRoot.innerHTML = `
                    <style>
                    </style>

                    <button class="hamburger-button aria-label="Toggle Menu">
                        Hamburger
                    </button>
                `;
        if (this.isOpen) {
            this.shadowRoot.querySelector('button').classList.add('open');
        }
    }
    toggleMenu() {
        this.isOpen = !this.isOpen;
        if (this.buttonElement) {
            this.buttonElement.classList.toggle('open', this.isOpen);
        }
        this.dispatchEvent(new CustomEvent('menu-toggle', {
            detail: { isOpen: this.isOpen },
            bubbles: true,
            composed: true
        }));
        console.log(`Menu is now: ${this.isOpen ? 'Open' : 'Closed'}`);
    }
}
if (!customElements.get('hamburger-button')) {
    customElements.define('hamburger-button', HamburgerButton);
}
