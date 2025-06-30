/* -------------------------------------------------------------------------- */

interface TabContainerAttributes {
}

/* -------------------------------------------------------------------------- */

export class TabContainer extends HTMLElement implements TabContainerAttributes {
    private _ContainerElement: HTMLDivElement = document.createElement('div');
    private _TabBarElement: HTMLDivElement = document.createElement('div');
    private _TabContentElement: HTMLDivElement = document.createElement('div');
    private _slots: HTMLSlotElement[] = [];
    private _tabs: HTMLButtonElement[] = [];

    /**
     * Creates an instance of the TabContainer component.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    /**
     * Returns an array of attribute names that this component observes.
     */
    static get observedAttributes() {
        return [];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback() {
        //
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        if (!this._ContainerElement) return;
        if (!this._TabBarElement) return;
        if (!this._TabContentElement) return;

        Array.from(this.children).forEach((child, idx) => {
            const slotName = child.slot || `tab-${idx}`;
            child.setAttribute('slot', slotName);

            const slot = document.createElement('slot');
            slot.name = slotName;
            if (idx === 0) {
                slot.classList.add('active');
            }

            this._TabContentElement.appendChild(slot);
            this._slots.push(slot);

            const tab = document.createElement('button');
            tab.classList.add('tab');

            if (idx === 0) {
                tab.classList.add('active');
            }

            tab.textContent = slotName;
            tab.addEventListener('click', this._onTabClick.bind(this, slot, tab));
            this._TabBarElement.appendChild(tab);
            this._tabs.push(tab);
        });
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        //..
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                overflow: hidden;
            }
            .container {
                display: grid;
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr;
                height: 100%;
                width: 100%;
                background-color: var(--tab-container-background-color, #ffffff);
            }
            .tabbar {
                background-color: var(--tab-container-tabbar-background-color, #ffffff);
                padding: 0.5rem 0 0 0.5rem;
                display: grid;
                grid-auto-flow: column;
                grid-auto-columns: min-content;
                border-bottom: 1px solid var(--tab-container-tabbar-border-color, #000000);
            }
            .tab {
                background-color: var(--tab-container-tabbar-background-color, #ffffff);
                border: 1px solid transparent;
                border-bottom: none;
                padding: 0.5rem;
                cursor: pointer;
                margin: 0;
                padding: .6rem 1rem;
                font-size: .8rem;
                font-weight: 400;
                user-select: none;
                font-family: inherit;
            }
            .tab.active {
                border-color: var(--tab-container-tab-active-border-color, #000000);
                background-color: var(--tab-container-tab-active-background-color, #ffffff);
                transform: translateY(1px);
                border-bottom: none;
            }
            .content {
                overflow: hidden;
            }
            slot {
                display: none;
            }
            slot.active {
                display: contents;
            }
        `;
        this.shadowRoot?.appendChild(style);
        this._ContainerElement = document.createElement('div');
        this._ContainerElement.classList.add('container');
        this._TabBarElement = document.createElement('div');
        this._TabBarElement.classList.add('tabbar');
        this._TabContentElement = document.createElement('div');
        this._TabContentElement.classList.add('content');
        this._ContainerElement.appendChild(this._TabBarElement);
        this._ContainerElement.appendChild(this._TabContentElement);
        this.shadowRoot?.appendChild(this._ContainerElement);
    }

    /**
     * Handles the click event on a tab button.
     * This method updates the active slot and tab based on the clicked tab.
     */
    private _onTabClick(slot: HTMLSlotElement, tab: HTMLButtonElement) {
        this._slots.forEach(slot => {
            slot.classList.remove('active');
        });
        this._tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        slot.classList.add('active');
        tab.classList.add('active');
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('tab-container', TabContainer);

/* -------------------------------------------------------------------------- */
