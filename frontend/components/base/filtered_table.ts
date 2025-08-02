/* -------------------------------------------------------------------------- */

import { IconButton } from './icon_button.js';

/* -------------------------------------------------------------------------- */

export interface FilteredTableAttributes {
    config?: string;
    contentUrl?: string;
    filter?: string
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
    orderBy?: string;
    sortImg?: string;
    emptyMessage?: string;
}

/* -------------------------------------------------------------------------- */

export interface RowClickedEvent {
    rowId?: string;
    tableId?: string;
}

/* -------------------------------------------------------------------------- */

export interface SelectionChangedEvent {
    selectedRows?: HTMLElement[];
    all: boolean;
    one: boolean;
    none: boolean;
}

/* -------------------------------------------------------------------------- */

export interface TableRenderErrorEvent {
    message: string;
    error: string;
}

/* -------------------------------------------------------------------------- */

export class FilteredTable extends HTMLElement implements FilteredTableAttributes {
    private _config?: string = undefined;
    private _contentUrl?: string = undefined;
    private _filter?: string = undefined;
    private _limit?: number = undefined;
    private _offset?: number = undefined;
    private _order?: 'asc' | 'desc' = undefined;
    private _orderBy?: string = undefined;
    private _sortImg?: string = undefined;

    private _configParsed: any = undefined;
    private _tableElement = document.createElement('table');

    get config() {
        return this._config || '{}';
    }

    set config(value: string) {
        this.setAttribute('config', value);
    }

    get contentUrl() {
        return this._contentUrl || '';
    }

    set contentUrl(value: string) {
        this.setAttribute('content-url', value);
    }

    get filter() {
        return this._filter || '';
    }

    set filter(value: string) {
        this.setAttribute('filter', value);
    }

    get limit() {
        return this._limit || 0;
    }

    set limit(value: number) {
        this.setAttribute('limit', value.toString());
    }

    get offset() {
        return this._offset || 0;
    }

    set offset(value: number) {
        this.setAttribute('offset', value.toString());
    }

    get order() {
        return this._order || 'asc';
    }

    set order(value: 'asc' | 'desc') {
        this.setAttribute('order', value);
    }

    get orderBy() {
        return this._orderBy || '';
    }

    set orderBy(value: string) {
        this.setAttribute('order-by', value);
    }

    get sortImg() {
        return this._sortImg || '';
    }

    set sortImg(value: string) {
        this.setAttribute('sort-img', value);
    }

    get emptyMessage() {
        return this._tableElement.style.getPropertyValue('--filtered-table-empty-message') || 'No items found';
    }

    set emptyMessage(value: string) {
        this.setAttribute('empty-message', value);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['config', 'content-url', 'filter', 'limit', 'offset', 'order', 'order-by', 'sort-img', 'empty-message'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'config') {
            this._config = newValue || '{}';
            this._parseConfig();
            this.updateContent();
        } else if (propertyName === 'content-url') {
            this._contentUrl = newValue || '';
            this.updateContent();
        } else if (propertyName === 'filter') {
            this._filter = newValue || '';
            this.updateContent();
        } else if (propertyName === 'limit') {
            this._limit = newValue ? parseInt(newValue, 10) : 0;
        } else if (propertyName === 'offset') {
            this._offset = newValue ? parseInt(newValue, 10) : 0;
        } else if (propertyName === 'order') {
            this._order = newValue as 'asc' | 'desc' || 'asc';
        } else if (propertyName === 'order-by') {
            this._orderBy = newValue || '';
        } else if (propertyName === 'sort-img') {
            this._sortImg = newValue || '';
        } else if (propertyName === 'empty-message') {
            this._tableElement.style.setProperty('--filtered-table-empty-message', `'${newValue || 'No items found'}'`);
        }
    }

    connectedCallback() {
        // ...
    }

    disconnectedCallback() {
        // ...
    }

    private _populateShadowRoot() {
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
                content: var(--filtered-table-empty-message, 'No items found');
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
                border-right: 1px solid var(--filtered-table-header-border-color, #000000);
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

            th > div {
                display: grid;
                grid-template-areas: "header sort";
                grid-template-columns: 1fr min-content;
                align-items: center;
            }

            th > div > span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            th > div > icon-button {
                opacity: var(--filtered-table-sort-icon-opacity, 0.5);
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
        this._tableElement.classList.remove('empty');

        this.shadowRoot.appendChild(this._tableElement);
    }

    private _parseConfig() {
        try {
            this._configParsed = JSON.parse(this.config);
        } catch (error) {
            throw new Error(`Failed to parse table config: ${error}`);
        }
    }

    public clearContent() {
        this._tableElement.innerHTML = '';
        this._tableElement.classList.add('loading');
        this._tableElement.classList.remove('empty');

        this.dispatchEvent(new CustomEvent<SelectionChangedEvent>('selection-changed', {
            detail: {
                selectedRows: [],
                all: false,
                none: true,
                one: false
            },
            bubbles: true,
            composed: true
        }));
    }

    public updateContent() {
        if (!this._configParsed || !this._contentUrl)
            return;

        this.clearContent();

        this._queryContent().then(content => {
            this.clearContent(); // prevent race conditions
            this._tableElement.classList.remove('loading');

            if (!content || content.length === 0) {
                this._tableElement.classList.add('empty');
            } else {
                this._addHeaders();
                this._addData(content);
            }
        }).catch(error => {
            this.clearContent();
            this._tableElement.classList.remove('loading');
            this._tableElement.classList.add('empty');
            this._dispatchError(`Unable to load table content.`, error);
        });
    }

    private _addHeaders() {
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

            const div = document.createElement('div');

            const span = document.createElement('span');
            span.textContent = this._configParsed.headers[key];
            th.style.gridArea = 'header';
            div.appendChild(span);

            const sortButton = new IconButton();
            sortButton.img = this._sortImg || '';
            sortButton.mode = "inherit";
            sortButton.ariaLabel = `Sort by ${this._configParsed.headers[key]}`;
            sortButton.addEventListener('click', () => {
                this._order = this._order === 'asc' ? 'desc' : 'asc';
                this._orderBy = key;
                this.updateContent();
            });
            sortButton.style.gridArea = 'sort';
            sortButton.display = 'inline-block';
            div.appendChild(sortButton);

            th.appendChild(div);
            tr.appendChild(th);
        }

        this._tableElement.appendChild(tr)
    }

    private _addData(content: any[]) {
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
                tr.id = item[this._configParsed.idColumn] || (crypto as any).randomUUID();
            } else {
                tr.id = item.id || (crypto as any).randomUUID();
            }
            tr.ariaLabel = `Row with id ${tr.id}`;
            tr.tabIndex = 0;
            tr.setAttribute('role', 'button')

            tr.addEventListener('keydown', (event: KeyboardEvent) => {
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
                const td = document.createElement('td');
                td.addEventListener('click', this._onRowClickedEvent(tr.id));

                const display: 'text' | 'chip' = this._configParsed?.display?.[key] || 'text';

                if (display === 'text') {
                    td.textContent = item[key] || '';
                } else {
                    const divElement = document.createElement('div');
                    divElement.classList.add('chip');
                    divElement.textContent = item[key] || '';
                    divElement.style.backgroundColor = `var(--filtered-table-chip-${item[key]}-background-color, #000000)`;
                    divElement.style.color = `var(--filtered-table-chip-${item[key]}-color, #ffffff)`;
                    td.appendChild(divElement);
                }

                tr.appendChild(td);
            }
            this._tableElement.appendChild(tr);
        }
    }

    private _onSelectAllOrNoneEvent() {
        return (event: Event) => {
            const checkbox = event.target as HTMLInputElement;
            const checkboxes = Array.from(this._tableElement.querySelectorAll('input[type="checkbox"][name="select-row"]')) as HTMLInputElement[];

            checkboxes.forEach(cb => {
                cb.checked = checkbox.checked;
                cb.dispatchEvent(new Event('change'));
            });
        }
    }

    private _onRowClickedEvent(rowId: string) {
        return (event: Event) => {
            this.dispatchEvent(new CustomEvent<RowClickedEvent>('row-clicked', {
                detail: {
                    tableId: this.id || undefined,
                    rowId: rowId
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    private _onSelectionChangeEvent(rowId: string) {
        return (event: Event) => {
            const checkboxes = Array.from(this._tableElement.querySelectorAll('input[type="checkbox"][name="select-row"]')) as HTMLInputElement[];
            this.dispatchEvent(new CustomEvent<SelectionChangedEvent>('selection-changed', {
                detail: {
                    selectedRows: checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.parentElement?.parentElement || checkbox),
                    all: checkboxes.every(checkbox => checkbox.checked),
                    none: checkboxes.every(checkbox => !checkbox.checked),
                    one: checkboxes.filter(checkbox => checkbox.checked).length === 1
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    private _dispatchError(message: string, error: Error) {
        this.dispatchEvent(new CustomEvent<TableRenderErrorEvent>('table-render-error', {
            detail: {
                message: message,
                error: error.message
            },
            bubbles: true,
            composed: true
        }));
    }

    public getSelectedRows(): HTMLElement[] {
        const checkboxes = Array.from(this._tableElement.querySelectorAll('input[type="checkbox"][name="select-row"]')) as HTMLInputElement[];
        return checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.parentElement?.parentElement || checkbox);
    }

    private async _queryContent(): Promise<any[]> {
        if (!this._contentUrl) {
            throw new Error("URL is not set for FilteredTable component.");
        }

        var url = new URL(this._contentUrl);
        if (this._filter) {
            url.searchParams.set('filter', this._filter);
        }
        if (this._offset) {
            url.searchParams.set('offset', this._offset.toString());
        }
        if (this._limit) {
            url.searchParams.set('limit', this._limit.toString());
        }
        if (this._order) {
            url.searchParams.set('order', this._order);
        }
        if (this._orderBy) {
            url.searchParams.set('order-by', this._orderBy);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: any | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch table content`);
        }

        return content;
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('filtered-table', FilteredTable);

/* -------------------------------------------------------------------------- */
