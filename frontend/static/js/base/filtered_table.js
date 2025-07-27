export class FilteredTable extends HTMLElement {
    _config = undefined;
    _contentUrl = undefined;
    _delay = undefined;
    _filter = undefined;
    _limit = undefined;
    _offset = undefined;
    _order = undefined;
    _orderBy = undefined;
    _configParsed = undefined;
    _tableElement = document.createElement('table');
    _filterTimeout = null;
    get config() {
        return this._config || '{}';
    }
    set config(value) {
        this.setAttribute('config', value);
    }
    get contentUrl() {
        return this._contentUrl || '';
    }
    set contentUrl(value) {
        this.setAttribute('content-url', value);
    }
    get delay() {
        return this._delay || 500;
    }
    set delay(value) {
        this.setAttribute('delay', value.toString());
    }
    get filter() {
        return this._filter || '';
    }
    set filter(value) {
        this.setAttribute('filter', value);
    }
    get limit() {
        return this._limit || 0;
    }
    set limit(value) {
        this.setAttribute('limit', value.toString());
    }
    get offset() {
        return this._offset || 0;
    }
    set offset(value) {
        this.setAttribute('offset', value.toString());
    }
    get order() {
        return this._order || 'asc';
    }
    set order(value) {
        this.setAttribute('order', value);
    }
    get orderBy() {
        return this._orderBy || '';
    }
    set orderBy(value) {
        this.setAttribute('order-by', value);
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['config', 'content-url', 'delay', 'filter', 'limit', 'offset', 'order', 'order-by'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'config') {
            this._config = newValue || '{}';
            this._parseConfig();
            this.updateContent();
        }
        else if (propertyName === 'content-url') {
            this._contentUrl = newValue || '';
            this.updateContent();
        }
        else if (propertyName === 'delay') {
            this._delay = newValue ? parseInt(newValue, 10) : 500;
        }
        else if (propertyName === 'filter') {
            this._filter = newValue || '';
        }
        else if (propertyName === 'limit') {
            this._limit = newValue ? parseInt(newValue, 10) : 0;
        }
        else if (propertyName === 'offset') {
            this._offset = newValue ? parseInt(newValue, 10) : 0;
        }
        else if (propertyName === 'order') {
            this._order = newValue || 'asc';
        }
        else if (propertyName === 'order-by') {
            this._orderBy = newValue || '';
        }
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
                display: block;
                height: 100%;
                overflow: auto;
                scrollbar-color: var(--scrollbar-color, inherit);
                scrollbar-width: var(--scrollbar-width, inherit);
                user-select: none;
                width: 100%;
            }

            table {
                border: none;
                border-collapse: collapse;
                color: var(--filtered-table-font-color, #000000);
                font-size: var(--filtered-table-font-size, 1rem);
                height: auto;
                min-width: 100%;
                width: auto;
            }

            table.loading::before {
                animation: spin 1s linear infinite;    
                border: var(--spinner-border-large) solid var(--spinner-color, #000000);
                border-radius: 50%; 
                border-top: var(--spinner-border-large) solid var(--spinner-color-top, #ffffff);
                content: "";
                display: block;
                height: var(--spinner-size-large, 30px);
                margin: 4rem auto;
                width: var(--spinner-size-large, 30px);
            }

            table.empty::before {
                color: var(--filtered-table-empty-color, #000000);
                content: "No projects found";
                display: block;
                font-size: var(--filtered-table-empty-font-size, 1rem);
                margin: 4rem auto;
                text-align: center;
            }

            tr {
                height: min-content;    
                outline: none;
            }

            tr:focus:not(:has(th)) {
                outline: 1px solid var(--filtered-table-tr-focus-outline-color, #000000);
            }

            tr:nth-child(2n) {
                background-color: var(--filtered-table-tr-even-background-color, #ffffff);
            }

            tr:nth-child(2n+1) {
                background-color: var(--filtered-table-tr-odd-background-color, #ffffff);
            }

            tr:hover:not(:has(th)) {
                background-color: var(--filtered-table-tr-hover-background-color, #ffffff);
                cursor: pointer;
            }

            th, td {
                font-size: var(--filtered-table-font-size, 1rem);
                height: min-content;      
                text-align: left;
            }

            th {
                background-color: var(--filtered-table-header-background-color, #ffffff);
                border-bottom: 1px solid transparent; /* make outline for rows visible */
                box-shadow: var(--filtered-table-header-box-shadow);
                font-weight: 500;
                padding: var(--filtered-table-th-padding, 0.5rem 0.5rem);
                position: sticky;
                top: 0;
                z-index: 1;
            }

            td {
                cursor: pointer;
                padding: var(--filtered-table-td-padding, 1.5rem 0.5rem);
            }
            
            .chip {
                border-radius: var(--filtered-table-chip-border-radius, 1rem);
                display: inline-block;
                padding: var(--filtered-table-chip-padding, 0.25rem 0.5rem);
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
        this.shadowRoot.appendChild(style);
        this._tableElement.classList.add('loading');
        this.shadowRoot.appendChild(this._tableElement);
    }
    _parseConfig() {
        try {
            this._configParsed = JSON.parse(this.config);
        }
        catch (error) {
            throw new Error(`Failed to parse table config: ${error}`);
        }
    }
    _clearContent() {
        this._tableElement.innerHTML = '';
        this._tableElement.classList.add('loading');
        this.dispatchEvent(new CustomEvent('selection-changed', {
            detail: {
                selectedRows: [],
                all: false,
                none: true
            },
            bubbles: true,
            composed: true
        }));
    }
    updateContent() {
        if (!this._configParsed || !this._contentUrl)
            return;
        this._clearContent();
        this._queryContent().then(content => {
            this._tableElement.classList.remove('loading');
            if (!content || content.length === 0) {
                this._tableElement.classList.add('empty');
            }
            else {
                this._addHeaders();
                this._addData(content);
            }
        }).catch(error => {
            this._clearContent();
            this._tableElement.classList.remove('loading');
            this._tableElement.classList.add('empty');
            this._dispatchError(`Unable to load table content.`, error);
            console.error(`Error loading table content:`, error);
        });
    }
    _addHeaders() {
        if (!this._configParsed || !this._configParsed.headers) {
            throw new Error("Table config is not set or does not contain headers.");
        }
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('select-checkbox');
        checkbox.name = 'select-all-or-none';
        checkbox.ariaLabel = 'Select all or none';
        checkbox.addEventListener('change', this._onSelectAllOrNoneEvent());
        th.appendChild(checkbox);
        tr.appendChild(th);
        for (const key of Object.keys(this._configParsed.headers)) {
            const th = document.createElement('th');
            th.textContent = this._configParsed.headers[key];
            tr.appendChild(th);
        }
        this._tableElement.appendChild(tr);
    }
    _addData(content) {
        if (!content || content.length === 0) {
            this._tableElement.classList.add('empty');
            return;
        }
        if (!this._configParsed || !this._configParsed.headers) {
            throw new Error("Table config is not set or does not contain headers.");
        }
        for (const item of content) {
            const tr = document.createElement('tr');
            if (this._configParsed && this._configParsed.idColumn) {
                tr.id = item[this._configParsed.idColumn] || crypto.randomUUID();
            }
            else {
                tr.id = item.id || crypto.randomUUID();
            }
            tr.ariaLabel = `Row with id ${tr.id}`;
            tr.tabIndex = 0;
            tr.setAttribute('role', 'button');
            tr.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    this._onRowClickedEvent(tr.id)(event);
                }
            });
            const td = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'select-row';
            checkbox.ariaLabel = `Select row with id${tr.id}`;
            checkbox.classList.add('select-checkbox');
            checkbox.value = tr.id;
            checkbox.addEventListener('change', this._onSelectionChangeEvent(tr.id));
            td.appendChild(checkbox);
            tr.appendChild(td);
            for (const key of Object.keys(this._configParsed.headers)) {
                if (!(key in item)) {
                    continue;
                }
                const td = document.createElement('td');
                td.addEventListener('click', this._onRowClickedEvent(tr.id));
                const display = this._configParsed?.display?.[key] || 'text';
                if (display === 'text') {
                    td.textContent = item[key];
                }
                else {
                    const divElement = document.createElement('div');
                    divElement.classList.add('chip');
                    divElement.textContent = item[key];
                    divElement.style.backgroundColor = `var(--filtered-table-chip-${item[key]}-background-color, #000000)`;
                    divElement.style.color = `var(--filtered-table-chip-${item[key]}-color, #ffffff)`;
                    td.appendChild(divElement);
                }
                tr.appendChild(td);
            }
            this._tableElement.appendChild(tr);
        }
    }
    _onSelectAllOrNoneEvent() {
        return (event) => {
            const checkbox = event.target;
            const checkboxes = Array.from(this._tableElement.querySelectorAll('input[type="checkbox"][name="select-row"]'));
            checkboxes.forEach(cb => {
                cb.checked = checkbox.checked;
                cb.dispatchEvent(new Event('change'));
            });
        };
    }
    _onRowClickedEvent(rowId) {
        return (event) => {
            this.dispatchEvent(new CustomEvent('row-clicked', {
                detail: {
                    tableId: this.id || undefined,
                    rowId: rowId
                },
                bubbles: true,
                composed: true
            }));
        };
    }
    _onSelectionChangeEvent(rowId) {
        return (event) => {
            const checkboxes = Array.from(this._tableElement.querySelectorAll('input[type="checkbox"][name="select-row"]'));
            this.dispatchEvent(new CustomEvent('selection-changed', {
                detail: {
                    selectedRows: checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.parentElement?.parentElement || checkbox),
                    all: checkboxes.every(checkbox => checkbox.checked),
                    none: checkboxes.every(checkbox => !checkbox.checked)
                },
                bubbles: true,
                composed: true
            }));
        };
    }
    _dispatchError(message, error) {
        this.dispatchEvent(new CustomEvent('table-render-error', {
            detail: {
                message: message,
                error: error
            },
            bubbles: true,
            composed: true
        }));
    }
    getSelectedRows() {
        const checkboxes = Array.from(this._tableElement.querySelectorAll('input[type="checkbox"][name="select-row"]'));
        return checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.parentElement?.parentElement || checkbox);
    }
    async _queryContent() {
        if (!this._contentUrl) {
            throw new Error("URL is not set for FilteredTable component.");
        }
        var url = new URL(this._contentUrl);
        if (this._filter) {
            url.searchParams.set('filter', this._filter);
        }
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const content = await response.json();
        if (!content) {
            throw new Error(`Failed to fetch table content`);
        }
        return content;
    }
}
customElements.define('filtered-table', FilteredTable);
