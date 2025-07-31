import { StyledInput } from './base/styled_input.js';
import { FilteredTable } from './base/filtered_table.js';
export class ListBasedContent extends HTMLElement {
    _searchInput = new StyledInput();
    _table = new FilteredTable();
    _buttonsDiv = document.createElement('div');
    _filterTimeout = null;
    get contentUrl() {
        return this._table.contentUrl || '';
    }
    set contentUrl(value) {
        this.setAttribute('content-url', value);
    }
    get sortImg() {
        return this._table.sortImg || '';
    }
    set sortImg(value) {
        this.setAttribute('sort-img', value);
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['content-url', 'project-gui-url', 'scan-url', 'sort-img'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'content-url') {
            this._table.contentUrl = newValue || '';
        }
        else if (propertyName === 'sort-img') {
            this._table.sortImg = newValue || '';
        }
    }
    connectedCallback() {
        this.shadowRoot?.addEventListener('row-clicked', (event) => this._onRowClicked(event));
        this.shadowRoot?.addEventListener('selection-changed', (event) => this._onSelectionChanged(event));
        this.shadowRoot?.addEventListener('table-render-error', (event) => this._onTableRenderError(event));
        this._searchInput.addEventListener('input', (event) => this._onSearchInputChange(event));
    }
    disconnectedCallback() {
        this.shadowRoot?.removeEventListener('row-clicked', (event) => this._onRowClicked(event));
        this.shadowRoot?.removeEventListener('selection-changed', (event) => this._onSelectionChanged(event));
        this.shadowRoot?.removeEventListener('table-render-error', (event) => this._onTableRenderError(event));
        this._searchInput.removeEventListener('input', (event) => this._onSearchInputChange(event));
    }
    _getTableConfig() {
        return '{}';
    }
    _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: grid;
                grid-template-areas:
                    "toolbar"
                    "table";
                grid-template-rows: auto 1fr;
                overflow: auto;
            }

            .toolbar {
                align-items: center;    
                background-color: var(--background-color);
                border-bottom: 1px solid var(--border-color);
                display: grid;
                grid-area: toolbar;
                grid-template-areas: "scan search";
                grid-template-columns: 1fr auto;
                padding: 0.5rem 1rem;
                user-select: none;
            }
        
            .toolbar > .buttons {
                align-items: center;    
                display: grid;
                gap: .5rem;
                grid-auto-columns: min-content;
                grid-auto-flow: column;
            }
        `;
        this.shadowRoot.appendChild(style);
        const toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');
        toolbar.style.gridArea = 'toolbar';
        this._buttonsDiv = document.createElement('div');
        this._buttonsDiv.classList.add('buttons');
        toolbar.appendChild(this._buttonsDiv);
        this._searchInput.type = "search";
        this._searchInput.placeholder = "Filter Projects...";
        this._searchInput.autocomplete = "off";
        this._searchInput.autocorrect = "off";
        this._searchInput.autocapitalize = "off";
        this._searchInput.spellcheck = false;
        this._searchInput.ariaLabel = "Filter Projects";
        this._searchInput.style.gridArea = 'search';
        this._searchInput.addEventListener('input', (event) => this._onSearchInputChange(event));
        toolbar.appendChild(this._searchInput);
        this._table.style.gridArea = 'table';
        this._table.ariaLabel = "Projects Table";
        this._table.config = this._getTableConfig();
        this._table.emptyMessage = 'No items found';
        this.shadowRoot.appendChild(toolbar);
        this.shadowRoot.appendChild(this._table);
    }
    _onRowClicked(event) {
    }
    _onSelectionChanged(event) {
    }
    _onTableRenderError(event) {
        const messageBox = document.querySelector('message-box');
        if (messageBox) {
            messageBox.showMessage(event.detail.message, 'error', event.detail.error || '');
        }
    }
    _onSearchInputChange(event) {
        this._table.clearContent();
        clearTimeout(this._filterTimeout);
        this._filterTimeout = setTimeout(() => {
            this._table.filter = this._searchInput.value.trim();
        }, 300);
    }
}
customElements.define('list-based-content', ListBasedContent);
