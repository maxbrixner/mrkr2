/* -------------------------------------------------------------------------- */

import { ListBasedContent, ListBasedContentAttributes } from './list_based_content.js';
import { MessageBox } from './base/message_box.js';
import { StyledButton } from './base/styled_button.js';
import { RowClickedEvent, SelectionChangedEvent } from './base/filtered_table.js';

/* -------------------------------------------------------------------------- */

interface ProjectsContentAttributes extends ListBasedContentAttributes {
    projectGuiUrl?: string;
    scanUrl?: string;
    createUrl?: string;
}

/* -------------------------------------------------------------------------- */

export class ProjectsContent extends ListBasedContent implements ProjectsContentAttributes {
    private _projectGuiUrl: string = '';
    private _scanUrl: string = '';
    private _createUrl: string = '';
    private _editUrl: string = '';

    private _scanButton: StyledButton = new StyledButton();
    private _createButton: StyledButton = new StyledButton();
    private _editButton: StyledButton = new StyledButton();


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

    get createUrl() {
        return this._createUrl;
    }

    set createUrl(value: string) {
        this.setAttribute('create-url', value);
    }

    get editUrl() {
        return this._editUrl;
    }

    set editUrl(value: string) {
        this._editButton.setAttribute('href', value);
    }

    constructor() {
        super();

        this._populateChildShadowRoot();
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'project-gui-url', 'scan-url', 'create-url', 'edit-url'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        super.attributeChangedCallback(propertyName, oldValue, newValue);

        if (propertyName === 'project-gui-url') {
            this._projectGuiUrl = newValue || '';
        } else if (propertyName === 'scan-url') {
            this._scanUrl = newValue || '';
        } else if (propertyName === 'create-url') {
            this._createUrl = newValue || '';
        } else if (propertyName === 'edit-url') {
            this._editUrl = newValue || '';
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._scanButton.addEventListener('click', (event: Event) => this._onScanButtonClick(event));
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        this._scanButton.removeEventListener('click', (event: Event) => this._onScanButtonClick(event));
    }

    protected _getTableConfig() {
        return '{"idColumn": "id", "headers": {"id": "ID", "name": "Name", "done": "Done", "open": "Open", "review": "Review", "created": "Created at", "updated": "Updated at"}, "filterElement": "filter"}';
    }

    private _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this._createButton.ariaLabel = "Create Project";
        this._createButton.textContent = "Create";
        this._createButton.addEventListener('click', (event: Event) => this._onCreateButtonClick(event));
        this._buttonsDiv.appendChild(this._createButton);

        this._editButton.ariaLabel = "Edit Project";
        this._editButton.textContent = "Edit";
        this._editButton.addEventListener('click', (event: Event) => this._onEditButtonClick(event));
        this._editButton.disabled = true;
        this._buttonsDiv.appendChild(this._editButton);

        this._scanButton.ariaLabel = "Schedule Scan";
        this._scanButton.textContent = "Schedule Scan";
        this._scanButton.disabled = true;
        this._buttonsDiv.appendChild(this._scanButton);

        this._table.emptyMessage = 'No projects found';
    }

    protected _onRowClicked(event: CustomEvent<RowClickedEvent>) {
        const detail = event.detail;
        const url = "";
        if (!detail.rowId) {
            throw new Error("Row ID is not defined.");
        }
        window.location.href = this._projectGuiUrl.replace("[ID]", String(detail.rowId));
    }

    protected _onSelectionChanged(event: CustomEvent<SelectionChangedEvent>) {
        const detail = event.detail;
        this._scanButton.disabled = detail.none;
        this._editButton.disabled = !detail.one;
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

    private _onCreateButtonClick(event: Event) {
        window.location.href = this._createUrl;
    }

    private _onEditButtonClick(event: Event) {
        const selectedRows = this._table.getSelectedRows();
        console.log(selectedRows);
        if (selectedRows.length !== 1 || !selectedRows[0] || !selectedRows[0].id) {
            return;
        }
        window.location.href = this._editUrl.replace("[ID]", String(selectedRows[0].id));
    }
}

/* -------------------------------------------------------------------------- */

customElements.define('projects-content', ProjectsContent);

/* -------------------------------------------------------------------------- */