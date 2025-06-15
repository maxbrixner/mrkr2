class HamburgerButton extends HTMLElement {
    private isOpen: boolean = false;
    private buttonElement: HTMLButtonElement | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        // Invoked when the custom element is added to the document's DOM.
        // This is where we set up the component's initial structure and event listeners.
        this.render();
        this.buttonElement = this.shadowRoot?.querySelector('button') || null;

        if (this.buttonElement) {
            this.buttonElement.addEventListener('click', this.toggleMenu.bind(this));
        }
    }

    disconnectedCallback(): void {
        // Invoked when the custom element is removed from the document's DOM.
        // Good place to clean up event listeners to prevent memory leaks.
        if (this.buttonElement) {
            this.buttonElement.removeEventListener('click', this.toggleMenu.bind(this));
        }
    }

    /**
     * Renders the HTML structure of the hamburger button.
     */
    private render(): void {
        this.shadowRoot!.innerHTML = `
                    <style>
                    </style>

                    <button class="hamburger-button aria-label="Toggle Menu">
                        Hamburger
                    </button>
                `;
        // Apply the 'open' class if the menu is currently open
        if (this.isOpen) {
            this.shadowRoot!.querySelector('button')!.classList.add('open');
        }
    }

    /**
     * Toggles the menu state (open/closed) and updates the button's appearance.
     * Dispatches a 'menu-toggle' custom event.
     */
    private toggleMenu(): void {
        this.isOpen = !this.isOpen;
        if (this.buttonElement) {
            this.buttonElement.classList.toggle('open', this.isOpen);
        }

        // Dispatch a custom event so parent components can react to the toggle.
        // Define the CustomEventInit type for better type safety
        interface MenuToggleEventDetail {
            isOpen: boolean;
        }

        this.dispatchEvent(new CustomEvent<MenuToggleEventDetail>('menu-toggle', {
            detail: { isOpen: this.isOpen },
            bubbles: true,   // Allow the event to bubble up the DOM tree
            composed: true   // Allow the event to cross shadow DOM boundaries
        }));

        // For demonstration: Log the state to the console
        console.log(`Menu is now: ${this.isOpen ? 'Open' : 'Closed'}`);
    }
}

// Define the custom element
if (!customElements.get('hamburger-button')) {
    customElements.define('hamburger-button', HamburgerButton);
}