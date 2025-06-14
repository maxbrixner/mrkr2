class StyledDialog extends HTMLElement {
    private _dialog: HTMLDivElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        // Create dialog container
        this._dialog = document.createElement('div');
        this._dialog.classList.add('dialog');
        this._dialog.innerHTML = `
            <div class="dialog-content">
                <slot name="content">Default Dialog Content</slot>
                <button class="close-button">Close</button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
            }
            .dialog-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .close-button {
                margin-top: 10px;
                padding: 8px 16px;
                background-color: #007BFF;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .close-button:hover {
                background-color: #0056b3;
            }
        `;

        // Append elements to shadow DOM
        shadow.appendChild(style);
        shadow.appendChild(this._dialog);

        // Add event listener for the close button
        this._dialog.querySelector('.close-button')?.addEventListener('click', () => this.close());
    }

    open() {
        this._dialog.style.display = 'flex';
    }

    close() {
        this._dialog.style.display = 'none';
    }
}

// Define the custom element
if (!customElements.get('styled-dialog')) {
    customElements.define('styled-dialog', StyledDialog);
}