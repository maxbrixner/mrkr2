/* -------------------------------------------------------------------------- */

import { MessageBox } from './base/message_box.js';
import { StyledButton } from './base/styled_button.js';
import { StyledInput } from './base/styled_input.js';
import { FilteredTable, RowClickedEvent, SelectionChangedEvent, TableRenderErrorEvent } from './base/filtered_table.js';

/* -------------------------------------------------------------------------- */

interface ProjectsContentAttributes {
    contentUrl?: string;
    projectGuiUrl?: string;
    scanUrl?: string;
    sortImg?: string;
}

/* -------------------------------------------------------------------------- */

export class ProjectsContent extends HTMLElement implements ProjectsContentAttributes {
    private _projectGuiUrl: string = '';
    private _scanUrl: string = '';

    private _searchInput: StyledInput = new StyledInput();
    private _scanButton: StyledButton = new StyledButton();
    private _table: FilteredTable = new FilteredTable();
    private _filterTimeout: any = null;

    get contentUrl() {
        return this._table.contentUrl || '';
    }

    set contentUrl(value: string) {
        this.setAttribute('content-url', value);
    }

    get projectGuiUrl() {
        return this._projectGuiUrl;
    }

    set projectGuiUrl(value: string) {
        this.setAttribute('project-gui-url', value);
    }

    get scanUrl() {
        return this._scanUrl;
    }

    set scanUrl(value: string) {
        this.setAttribute('scan-url', value);
    }

    get sortImg() {
        return this._table.sortImg || '';
    }

    set sortImg(value: string) {
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

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'content-url') {
            this._table.contentUrl = newValue || '';
        } else if (propertyName === 'project-gui-url') {
            this._projectGuiUrl = newValue || '';
        } else if (propertyName === 'scan-url') {
            this._scanUrl = newValue || '';
        } else if (propertyName === 'sort-img') {
            this._table.sortImg = newValue || '';
        }
    }

    connectedCallback() {
        this.shadowRoot?.addEventListener('row-clicked', (event: Event) => this._onRowClicked(event as CustomEvent<RowClickedEvent>));
        this.shadowRoot?.addEventListener('selection-changed', (event: Event) => this._onSelectionChanged(event as CustomEvent<SelectionChangedEvent>));
        this.shadowRoot?.addEventListener('table-render-error', (event: Event) => this._onTableRenderError(event as CustomEvent<TableRenderErrorEvent>));
        this._scanButton.addEventListener('click', (event: Event) => this._onScanButtonClick(event));
        this._searchInput.addEventListener('input', (event: Event) => this._onSearchInputChange(event));
    }

    disconnectedCallback() {
        this.shadowRoot?.removeEventListener('row-clicked', (event: Event) => this._onRowClicked(event as CustomEvent<RowClickedEvent>));
        this.shadowRoot?.removeEventListener('selection-changed', (event: Event) => this._onSelectionChanged(event as CustomEvent<SelectionChangedEvent>));
        this.shadowRoot?.removeEventListener('table-render-error', (event: Event) => this._onTableRenderError(event as CustomEvent<TableRenderErrorEvent>));
        this._scanButton.removeEventListener('click', (event: Event) => this._onScanButtonClick(event));
        this._searchInput.removeEventListener('input', (event: Event) => this._onSearchInputChange(event));
    }

    private _populateShadowRoot() {
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

        this._scanButton.ariaLabel = "Schedule Scan";
        this._scanButton.textContent = "Schedule Scan";
        this._scanButton.disabled = true;
        toolbar.appendChild(this._scanButton);

        this._searchInput.type = "search";
        this._searchInput.placeholder = "Filter Projects...";
        this._searchInput.autocomplete = "off";
        this._searchInput.autocorrect = "off";
        this._searchInput.autocapitalize = "off";
        this._searchInput.spellcheck = false;
        this._searchInput.ariaLabel = "Filter Projects";
        this._searchInput.style.gridArea = 'search';
        this._searchInput.addEventListener('input', (event: Event) => this._onSearchInputChange(event));
        toolbar.appendChild(this._searchInput);

        this._table.style.gridArea = 'table';
        this._table.ariaLabel = "Projects Table";
        this._table.config = '{"idColumn": "id", "headers": {"id": "ID", "name": "Name", "done": "Done", "open": "Open", "review": "Review", "created": "Created at", "updated": "Updated at"}, "filterElement": "filter"}';
        this._table.emptyMessage = 'No projects found';

        this.shadowRoot.appendChild(toolbar)
        this.shadowRoot.appendChild(this._table);
    }

    private _onRowClicked(event: CustomEvent<RowClickedEvent>) {
        const detail = event.detail;
        const url = "";
        if (!detail.rowId) {
            throw new Error("Row ID is not defined.");
        }
        window.location.href = this._projectGuiUrl.replace("[ID]", String(detail.rowId));
    }

    private _onSelectionChanged(event: CustomEvent<SelectionChangedEvent>) {
        const detail = event.detail;
        this._scanButton.disabled = detail.none;
    }

    private _onTableRenderError(event: CustomEvent<TableRenderErrorEvent>) {
        const messageBox = document.querySelector('message-box') as MessageBox | null;
        if (messageBox) {
            messageBox.showMessage(
                event.detail.message,
                'error',
                event.detail.error || ''
            )
        }
    }

    private _onScanButtonClick(event: Event) {
        this._table.getSelectedRows().forEach((rowElement) => {
            const messageBox = document.querySelector('message-box') as MessageBox | null;
            const scanUrl = this._scanUrl.replace("[ID]", rowElement.id);
            fetch(scanUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (response.ok && messageBox) {
                    messageBox.showMessage(`A scan for project ${rowElement.id} was scheduled successfully. It may take a while until all documents are processed.`, 'success');
                } else if (messageBox) {
                    messageBox.showMessage(`Unable to schedule scan.`, 'error', 'Server Error');
                }
            }).catch(error => {
                messageBox?.showMessage(`Unable to schedule scan.`, 'error', error.message);
            });
        });
    }

    private _onSearchInputChange(event: Event) {
        this._table.clearContent();
        clearTimeout((this as any)._filterTimeout);
        this._filterTimeout = setTimeout(() => {
            this._table.filter = this._searchInput.value.trim();
        }, 300);
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('projects-content', ProjectsContent);

/* -------------------------------------------------------------------------- */