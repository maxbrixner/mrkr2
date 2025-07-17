/* -------------------------------------------------------------------------- */

export interface FilteredTableAttributes {
    contentUrl?: string;
    config?: string
}

/* -------------------------------------------------------------------------- */

export class FilteredTable extends HTMLElement implements FilteredTableAttributes {
    public contentUrl?: string = undefined;
    public config?: string = undefined;
    private _configParsed: any = undefined;
    private _table = document.createElement('table');


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
            if (this.config) {
                this._configParsed = JSON.parse(this.config);

            }
            this._updateContent();
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        // ...
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
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                user-select: none;
            }

            table {
                width: auto;
                height: auto;
                min-width: 100%;
                min-height: 100%;
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

    private _updateContent() {
        if (!this._configParsed || !this.contentUrl)
            return;

        this._table.classList.add('loading');
        this._table.innerHTML = ''; // Clear previous content

        this._queryContent().then(content => {
            this._table.classList.remove('loading');
            // Process and render content in the table
            // This part is left for implementation based on content structure
            console.log("Content fetched:", content);
            this._addHeaders(content);
            this._table.classList.remove('loading');

        }).catch(error => {
            console.error("Error fetching content:", error);
            this._table.classList.remove('loading');
        });
    }

    private _addHeaders(content: any[]) {
        if (content.length === 0) {
            return;
        }
        for (const key of Object.keys(content[0])) {
            const th = document.createElement('th');
            console.log(this._configParsed)
            const text = this._configParsed['headers'][key] || key;

            th.textContent = text;

            this._table.appendChild(th);
        }

    }

    /**
     * Queries the content of the table.
     */
    private async _queryContent(): Promise<any[]> {
        if (!this.contentUrl) {
            throw new Error("URL is not set for FilteredTable component.");
        }

        const response = await fetch(this.contentUrl);
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
