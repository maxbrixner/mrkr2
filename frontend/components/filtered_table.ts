/* -------------------------------------------------------------------------- */

export interface FilteredTableAttributes {
    contentUrl?: string;
    config?: string;
    filter?: string
    orderBy?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    delay?: number;
}

export interface FilteredTableConfig {
    headers?: { [key: string]: string };
    filterElement?: string;
    idColumn?: string;
    display?: { [key: string]: "text" | "chip" };
    chips?: { [key: string]: string };
}

export interface RowClickedEvent {
    tableId?: string;
    rowId?: string;
}

export interface SelectionChangedEvent {
    atLeastOneSelected: boolean;
}

/* -------------------------------------------------------------------------- */

export class FilteredTable extends HTMLElement implements FilteredTableAttributes {
    public contentUrl?: string = undefined;
    public config?: string = undefined;
    public filter?: string = undefined;
    public orderBy?: string = undefined;
    public order?: 'asc' | 'desc' = undefined;
    public limit?: number = undefined;
    public offset?: number = undefined;
    public delay?: number = 500;
    private _configParsed: any = undefined;
    private _table = document.createElement('table');
    private _filterTimeout: any = null;


    /**
     * Creates an instance of StyledButton.
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
        return ['content-url', 'table-config'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (propertyName === 'content-url') {
            this.contentUrl = newValue || undefined;
            this._updateContent();
        }
        if (propertyName === 'table-config') {
            this.config = newValue || undefined;
            this._parseConfig();
            this._updateContent();
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        this._parseConfig();

        if (this._configParsed && this._configParsed.filterElement) {
            const filterElement = document.getElementById(this._configParsed.filterElement);
            if (filterElement) {
                filterElement.addEventListener('input', (event: Event) => {
                    //only do this after a delay of 500ms
                    this._clearContent();
                    clearTimeout((this as any)._filterTimeout);
                    (this as any)._filterTimeout = setTimeout(() => {
                        const target = event.target as HTMLInputElement;
                        this.filter = target.value;
                        this._updateContent();
                    }, this.delay);
                });
            }
        }
    }

    /**
     * Called when the component is removed from the DOM.
     */
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
                width: 100%;
                height: 100%;
                overflow: auto;
                scrollbar-color: var(--document-viewer-scrollbar-color, inherit); /* todo */
                scrollbar-width: thin;
                user-select: none;
            }

            table {
                border: none;
                border-collapse: collapse;
                width: auto;
                height: auto;
                min-width: 100%;
            }

            table.loading::before {
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

            tr {
                outline: none;
                height: min-content;
            }

            tr:focus:not(:has(th)) {
                outline: 1px solid var(--primary-color, #007bff);
            }

            tr:nth-child(2n) {
                background-color: #fdfdfc; /* todo */
            }

            tr:nth-child(2n+1) {
                background-color: #f9f8f6; /* todo */
            }

            tr:hover:not(:has(th)) {
                background-color: #f0f3fe;
                cursor: pointer;
            }

            th, td {
                text-align: left;
                height: min-content;
                font-size: .9rem;
            }

            th {
                font-weight: 500;
                padding: 0.5rem;
                /* add bottom shadow */
                box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.1);
                background-color: #f9f8f6; /* todo */
                color: #333; /* todo */
                position: sticky;
                top: 0;
                z-index: 1;
                border-bottom: 3px solid transparent; /* makes the outline for rows work */
            }

            td {
                cursor: pointer;
                padding: 1.5rem 0.5rem;
            }
            
            .chip {
                display: inline-block;
                padding: 0.2rem 0.5rem;
                border-radius: 1rem;
                font-size: 0.8rem;    
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }

                100% {
                    transform: rotate(360deg);
                }
            }
        }
        `;
        this.shadowRoot.appendChild(style);

        this._table.classList.add('loading');

        this.shadowRoot.appendChild(this._table);
    }

    private _parseConfig() {
        if (!this.config) {
            this._configParsed = {};
            return;
        }
        try {
            this._configParsed = JSON.parse(this.config);
        } catch (error) {
            throw new Error(`Failed to parse table config: ${error}`);
        }
    }

    private _clearContent() {
        this._table.innerHTML = '';
        this._table.classList.add('loading');
    }

    private _updateContent() {
        if (!this._configParsed || !this.contentUrl)
            return;

        this._clearContent();

        this._queryContent().then(content => {
            this._table.classList.remove('loading');
            // Process and render content in the table
            // This part is left for implementation based on content structure
            this._table.classList.remove('loading');
            this._addHeaders(content);
            this._addData(content);

        }).catch(error => {
            console.error("Error fetching content:", error);
            this._table.classList.remove('loading');
        });
    }

    private _addHeaders(content: any[]) {
        if (content.length === 0) {
            return;
        }
        const tr = document.createElement('tr');

        const th = document.createElement('th');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('select-checkbox');
        checkbox.name = 'select-all-or-none';
        th.appendChild(checkbox);
        tr.appendChild(th);

        for (const key of Object.keys(content[0])) {
            const th = document.createElement('th');
            const text = this._configParsed['headers'][key] || key;

            th.textContent = text;

            tr.appendChild(th);
        }

        this._table.appendChild(tr)

    }

    private _addData(content: any[]) {
        if (content.length === 0) {
            return;
        }

        for (const item of content) {
            const tr = document.createElement('tr');
            tr.ariaLabel = `Row for ${item.id}`; // Assuming each item has an 'id' property
            tr.tabIndex = 0; // Make the row focusable
            tr.role = 'button'; // Set the role for accessibility

            if (this._configParsed && this._configParsed.idColumn) {
                tr.id = item[this._configParsed.idColumn] || crypto.randomUUID();
            } else {
                tr.id = item.id || crypto.randomUUID();
            }

            tr.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.key === 'Enter') {
                    this._onRowClickedEvent(tr.id)(event);
                }
            });

            const td = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'select-row';
            checkbox.classList.add('select-checkbox');
            checkbox.value = item.id; // Assuming each item has an 'id' property

            checkbox.addEventListener('change', this._onSelectionChangeEvent(tr.id));

            td.appendChild(checkbox);
            tr.appendChild(td);

            for (const key in item) {
                const td = document.createElement('td');
                td.addEventListener('click', this._onRowClickedEvent(tr.id));

                const display: 'text' | 'chip' = this._configParsed?.display?.[key] || 'text';

                if (display === 'text') {
                    td.textContent = item[key];
                } else {
                    const divElement = document.createElement('div');
                    divElement.classList.add('chip');
                    divElement.textContent = item[key];
                    divElement.style.backgroundColor = this._configParsed?.chips?.[item[key]] || '#e0e0e0'; // Default color if not specified
                    td.appendChild(divElement);
                }

                tr.appendChild(td);
            }
            this._table.appendChild(tr);
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
            const checkboxes = Array.from(this._table.querySelectorAll('input[type="checkbox"][name="select-row"]')) as HTMLInputElement[];
            const atLeastOneSelected = checkboxes.some(checkbox => checkbox.checked);
            this.dispatchEvent(new CustomEvent<SelectionChangedEvent>('selection-changed', {
                detail: {
                    atLeastOneSelected: atLeastOneSelected
                },
                bubbles: true,
                composed: true
            }));
        }
    }

    /**
     * Queries the content of the table.
     */
    private async _queryContent(): Promise<any[]> {
        if (!this.contentUrl) {
            throw new Error("URL is not set for FilteredTable component.");
        }

        var url = new URL(this.contentUrl);
        if (this.filter) {
            url.searchParams.set('filter', this.filter);
        }

        const response = await fetch(url);
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
