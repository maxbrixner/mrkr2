interface TabContainerAttributes {
}

class TabContainer extends HTMLElement implements TabContainerAttributes {
    private _ContainerElement: HTMLDivElement;
    private _TabBarElement: HTMLDivElement;
    private _TabContentElement: HTMLDivElement;
    private _slots: HTMLSlotElement[] = [];
    private _tabs: HTMLButtonElement[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

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
                font-weight: 500;
                user-select: none;
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
        console.log("TabContainer: constructor");
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

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback() {
        //
    }

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

    disconnectedCallback() {
        //..
    }

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

customElements.define('tab-container', TabContainer);