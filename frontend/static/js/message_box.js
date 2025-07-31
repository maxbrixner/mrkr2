export class MessageBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return [];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
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
                display: grid;
                grid-auto-rows: min-content;
                position: absolute;
                top: 1rem;
                left: 10%;
                right: 10%;
                background-color: transparent;
                z-index: 10;
                gap: .5rem;
            }

            .message {
                padding: 1rem;
                border-radius: 5px;
                border: 1px solid transparent;
                font-size: 1rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
        `;
        this.shadowRoot.appendChild(style);
    }
    showMessage(message, type = 'info', details) {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const messages = this.shadowRoot.querySelectorAll('.message');
        if (messages.length >= 5) {
            this.shadowRoot.removeChild(messages[0]);
        }
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        this.shadowRoot.appendChild(messageElement);
        switch (type) {
            case 'info':
                messageElement.style.backgroundColor = '#e8f5e9';
                messageElement.style.color = '#1b5e20';
                messageElement.style.borderColor = '#90caf9';
                if (details) {
                    console.log(`Details: ${details}`);
                }
                break;
            case 'warning':
                messageElement.style.backgroundColor = '#fffde7';
                messageElement.style.color = '#f57f17';
                messageElement.style.borderColor = '#ffeb3b';
                if (details) {
                    console.warn(`Details: ${details}`);
                }
                break;
            case 'error':
                messageElement.style.backgroundColor = '#ffebee';
                messageElement.style.color = '#c62828';
                messageElement.style.borderColor = '#ef9a9a';
                if (details) {
                    console.error(`Details: ${details}`);
                }
                break;
        }
        setTimeout(() => {
            if (this.shadowRoot) {
                this.shadowRoot.removeChild(messageElement);
            }
        }, 5000);
    }
}
customElements.define('message-box', MessageBox);
