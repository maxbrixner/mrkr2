import { ListBasedContent } from './list_based_content.js';
import { StyledButton } from './base/styled_button.js';
export class ProjectsContent extends ListBasedContent {
    _projectGuiUrl = '';
    _scanUrl = '';
    _createUrl = '';
    _scanButton = new StyledButton();
    _createButton = new StyledButton();
    _editButton = new StyledButton();
    get projectGuiUrl() {
        return this._projectGuiUrl;
    }
    set projectGuiUrl(value) {
        this.setAttribute('project-gui-url', value);
    }
    get scanUrl() {
        return this._scanUrl;
    }
    set scanUrl(value) {
        this.setAttribute('scan-url', value);
    }
    get createUrl() {
        return this._createUrl;
    }
    set createUrl(value) {
        this.setAttribute('create-url', value);
    }
    constructor() {
        super();
        this._populateChildShadowRoot();
    }
    static get observedAttributes() {
        return [...super.observedAttributes, 'project-gui-url', 'scan-url', 'create-url'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'project-gui-url') {
            this._projectGuiUrl = newValue || '';
        }
        else if (propertyName === 'scan-url') {
            this._scanUrl = newValue || '';
        }
        else if (propertyName === 'create-url') {
            this._createUrl = newValue || '';
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this._scanButton.addEventListener('click', (event) => this._onScanButtonClick(event));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._scanButton.removeEventListener('click', (event) => this._onScanButtonClick(event));
    }
    _getTableConfig() {
        return '{"idColumn": "id", "headers": {"id": "ID", "name": "Name", "done": "Done", "open": "Open", "review": "Review", "created": "Created at", "updated": "Updated at"}, "filterElement": "filter"}';
    }
    _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this._createButton.ariaLabel = "Create Project";
        this._createButton.textContent = "Create";
        this._createButton.addEventListener('click', (event) => this._onCreateButtonClick(event));
        this._buttonsDiv.appendChild(this._createButton);
        this._editButton.ariaLabel = "Edit Project";
        this._editButton.textContent = "Edit";
        this._editButton.addEventListener('click', (event) => this._onEditButtonClick(event));
        this._editButton.disabled = true;
        this._buttonsDiv.appendChild(this._editButton);
        this._scanButton.ariaLabel = "Schedule Scan";
        this._scanButton.textContent = "Schedule Scan";
        this._scanButton.disabled = true;
        this._buttonsDiv.appendChild(this._scanButton);
        this._table.emptyMessage = 'No projects found';
    }
    _onRowClicked(event) {
        const detail = event.detail;
        const url = "";
        if (!detail.rowId) {
            throw new Error("Row ID is not defined.");
        }
        window.location.href = this._projectGuiUrl.replace("[ID]", String(detail.rowId));
    }
    _onSelectionChanged(event) {
        const detail = event.detail;
        this._scanButton.disabled = detail.none;
        this._editButton.disabled = !detail.one;
    }
    _onScanButtonClick(event) {
        this._table.getSelectedRows().forEach((rowElement) => {
            const messageBox = document.querySelector('message-box');
            const scanUrl = this._scanUrl.replace("[ID]", rowElement.id);
            fetch(scanUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (response.ok && messageBox) {
                    messageBox.showMessage(`A scan for project ${rowElement.id} was scheduled successfully. It may take a while until all documents are processed.`, 'success');
                }
                else if (messageBox) {
                    messageBox.showMessage(`Unable to schedule scan.`, 'error', 'Server Error');
                }
            }).catch(error => {
                messageBox?.showMessage(`Unable to schedule scan.`, 'error', error.message);
            });
        });
    }
    _onCreateButtonClick(event) {
        window.location.href = this._createUrl;
    }
    _onEditButtonClick(event) {
        window.location.href = this._createUrl;
    }
}
customElements.define('projects-content', ProjectsContent);
