export class TabContainer extends HTMLElement {
    _TabBarElement = document.createElement('div');
    _TabContentElement = document.createElement('div');
    _slots = [];
    _tabs = [];
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return [];
    }
    attributeChangedCallback() {
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
                background-color: var(--tab-container-background-color, #ffffff);    
                display: grid;
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr;
                height: 100%;
                overflow: hidden;
                width: 100%;
                user-select: none;
            }

            .tabbar {
                background-color: var(--tab-container-tabbar-background-color, #ffffff);
                border-bottom: 1px solid var(--tab-container-tabbar-border-color, #000000);
                display: grid;
                gap: 2px;
                grid-auto-columns: min-content;
                grid-auto-flow: column;
                padding: 0.5rem 0 0 0.5rem;
            }

            .tab {
                background-color: var(--tab-container-tabbar-background-color, #ffffff);
                border: 1px solid transparent;
                border-bottom: none;
                cursor: pointer;
                font-family: inherit;
                font-size: .8rem;
                font-weight: 500;
                margin: 0;
                overflow: hidden;
                padding: .6rem 1rem;
                text-overflow: ellipsis;
                white-space: nowrap;
                width: 100px;
            }

            .tab.active {
                background-color: var(--tab-container-tab-active-background-color, #ffffff);
                border-color: var(--tab-container-tab-active-border-color, #000000);
                transform: translateY(1px);
            }

            .content {
                background-color: var(--tab-container-content-background-color, #ffffff);
                height: 100%;
                overflow: hidden;
                width: 100%;
            }

            slot {
                display: none;
            }

            slot.active {
                display: contents;
            }

           :host(.loading)::before {
                animation: spin 1s linear infinite;    
                border: 4px solid var(--spinner-color, #000000);
                border-radius: 50%; 
                border-top: 4px solid var(--spinner-color-top, #ffffff);
                content: "";
                display: block;
                height: 30px;
                margin: 4rem auto;
                width: 30px;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }
        `;
        this.shadowRoot?.appendChild(style);
        this.classList.add('loading');
    }
    _reset() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        if (this.shadowRoot.contains(this._TabBarElement))
            this.shadowRoot.removeChild(this._TabBarElement);
        if (this.shadowRoot.contains(this._TabContentElement))
            this.shadowRoot.removeChild(this._TabContentElement);
        this._TabBarElement.innerHTML = '';
        this._TabContentElement.innerHTML = '';
        this._slots = [];
        this._tabs = [];
        this.classList.add('loading');
    }
    updateTabs() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this._reset();
        this.classList.remove('loading');
        this._TabBarElement.classList.add('tabbar');
        this.shadowRoot.appendChild(this._TabBarElement);
        this._TabContentElement.classList.add('content');
        this.shadowRoot.appendChild(this._TabContentElement);
        Array.from(this.children).forEach((child, idx) => {
            const slotName = child.slot || `tab-${idx}`;
            const slot = document.createElement('slot');
            slot.name = slotName;
            this._TabContentElement.appendChild(slot);
            this._slots.push(slot);
            const tab = document.createElement('button');
            tab.classList.add('tab');
            tab.name = slotName;
            tab.ariaLabel = slotName;
            tab.textContent = slotName;
            if (idx === 0) {
                slot.classList.add('active');
                tab.classList.add('active');
            }
            tab.addEventListener('click', (event) => {
                event.stopPropagation();
                this._onTabClick(slot, tab);
            });
            this._TabBarElement.appendChild(tab);
            this._tabs.push(tab);
        });
    }
    _onTabClick(slot, tab) {
        this._slots.forEach(slot => {
            slot.classList.remove('active');
        });
        this._tabs.forEach(tab => {
            tab.classList.remove('active');
        });
        slot.classList.add('active');
        tab.classList.add('active');
    }
    switchToTab(slotName) {
        const slot = this._slots.find(s => s.name === slotName);
        const tab = this._tabs.find(t => t.name === slotName);
        if (slot && tab) {
            this._slots.forEach(s => s.classList.remove('active'));
            this._tabs.forEach(t => t.classList.remove('active'));
            slot.classList.add('active');
            tab.classList.add('active');
        }
    }
}
customElements.define('tab-container', TabContainer);
