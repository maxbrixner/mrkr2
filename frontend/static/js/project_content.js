import { ListBasedContent } from './list_based_content.js';
import { StyledButton } from './base/styled_button.js';
import { CheckboxDialog } from './base/checkbox_dialog.js';
export class ProjectContent extends ListBasedContent {
    _labelGuiUrl = '';
    _listUsersUrl = '';
    _listStatusesUrl = '';
    _updateAssignToUrl = '';
    _updateReviewByUrl = '';
    _updateMarkAsUrl = '';
    _assignToButton = new StyledButton();
    _reviewByButton = new StyledButton();
    _markAsButton = new StyledButton();
    _assignToDialog = new CheckboxDialog();
    _reviewByDialog = new CheckboxDialog();
    _markAsDialog = new CheckboxDialog();
    get labelGuiUrl() {
        return this._labelGuiUrl;
    }
    set labelGuiUrl(value) {
        this.setAttribute('label-gui-url', value);
    }
    get listUsersUrl() {
        return this._listUsersUrl;
    }
    set listUsersUrl(value) {
        this.setAttribute('list-users-url', value);
    }
    get listStatusesUrl() {
        return this._listStatusesUrl;
    }
    set listStatusesUrl(value) {
        this.setAttribute('list-statuses-url', value);
    }
    get updateAssignToUrl() {
        return this._updateAssignToUrl;
    }
    set updateAssignToUrl(value) {
        this.setAttribute('update-assign-to-url', value);
    }
    get updateReviewByUrl() {
        return this._updateReviewByUrl;
    }
    set updateReviewByUrl(value) {
        this.setAttribute('update-review-by-url', value);
    }
    get updateMarkAsUrl() {
        return this._updateMarkAsUrl;
    }
    set updateMarkAsUrl(value) {
        this.setAttribute('update-mark-as-url', value);
    }
    constructor() {
        super();
        this._populateChildShadowRoot();
    }
    static get observedAttributes() {
        return [...super.observedAttributes, 'label-gui-url', 'list-users-url', 'list-statuses-url', 'update-assign-to-url', 'update-review-by-url', 'update-mark-as-url'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'label-gui-url') {
            this._labelGuiUrl = newValue || '';
        }
        else if (propertyName === 'list-users-url') {
            this._listUsersUrl = newValue || '';
            this._assignToDialog.contentUrl = this._listUsersUrl;
            this._reviewByDialog.contentUrl = this._listUsersUrl;
        }
        else if (propertyName === 'list-statuses-url') {
            this._listStatusesUrl = newValue || '';
            this._markAsDialog.contentUrl = this._listStatusesUrl;
        }
        else if (propertyName === 'update-assign-to-url') {
            this._updateAssignToUrl = newValue || '';
        }
        else if (propertyName === 'update-review-by-url') {
            this._updateReviewByUrl = newValue || '';
        }
        else if (propertyName === 'update-mark-as-url') {
            this._updateMarkAsUrl = newValue || '';
        }
    }
    connectedCallback() {
        super.connectedCallback();
        this._assignToButton.addEventListener('click', (event) => this._onAssignToButtonClick(event));
        this._reviewByButton.addEventListener('click', (event) => this._onReviewByButtonClick(event));
        this._markAsButton.addEventListener('click', (event) => this._onMarkAsButtonClick(event));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this._assignToButton.removeEventListener('click', (event) => this._onAssignToButtonClick(event));
        this._reviewByButton.removeEventListener('click', (event) => this._onReviewByButtonClick(event));
        this._markAsButton.removeEventListener('click', (event) => this._onMarkAsButtonClick(event));
    }
    _getTableConfig() {
        return '{"idColumn": "id", "headers": {"id": "ID", "path": "Path", "status": "Status", "assignee_name": "Assignee", "reviewer_name": "Reviewer", "created": "Created at", "updated": "Updated at"}, "filterElement": "filter", "display": {"status": "chip"}}';
    }
    _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this._markAsButton.ariaLabel = "Mark as...";
        this._markAsButton.textContent = "Mark as...";
        this._markAsButton.disabled = true;
        this._buttonsDiv.appendChild(this._markAsButton);
        this._assignToButton.ariaLabel = "Assign to...";
        this._assignToButton.textContent = "Assign to...";
        this._assignToButton.disabled = true;
        this._buttonsDiv.appendChild(this._assignToButton);
        this._reviewByButton.ariaLabel = "Review by...";
        this._reviewByButton.textContent = "Review by...";
        this._reviewByButton.disabled = true;
        this._buttonsDiv.appendChild(this._reviewByButton);
        this._assignToDialog.heading = "Assign to...";
        this._assignToDialog.contentUrl = this._listUsersUrl;
        this._assignToDialog.idField = "id";
        this._assignToDialog.displayField = "username";
        this.shadowRoot.appendChild(this._assignToDialog);
        this._reviewByDialog.heading = "Review by...";
        this._reviewByDialog.contentUrl = this._listUsersUrl;
        this._reviewByDialog.idField = "id";
        this._reviewByDialog.displayField = "username";
        this.shadowRoot.appendChild(this._reviewByDialog);
        this._markAsDialog.heading = "Mark as...";
        this._markAsDialog.contentUrl = this._listStatusesUrl;
        this._markAsDialog.idField = "name";
        this._markAsDialog.displayField = "value";
        this.shadowRoot.appendChild(this._markAsDialog);
        this._table.emptyMessage = 'No documents found';
    }
    _onRowClicked(event) {
        const detail = event.detail;
        const url = "";
        if (!detail.rowId) {
            throw new Error("Row ID is not defined.");
        }
        window.location.href = this._labelGuiUrl.replace("[ID]", String(detail.rowId));
    }
    _onSelectionChanged(event) {
        const detail = event.detail;
        this._assignToButton.disabled = detail.none;
        this._reviewByButton.disabled = detail.none;
        this._markAsButton.disabled = detail.none;
    }
    _onAssignToConfirm(userId) {
        const messageBox = document.querySelector('message-box');
        const selectedDocuments = this._table.getSelectedRows().map(row => row.id);
        const selectedUser = userId;
        fetch(this._updateAssignToUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ document_ids: selectedDocuments, assignee_id: selectedUser })
        }).then(response => {
            if (response.ok) {
                this._table.updateContent();
                if (messageBox) {
                    messageBox.showMessage(`Documents have been assigned successfully.`, 'success');
                }
            }
            else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to assign documents.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to assign documents.`, 'error', error.message);
        });
    }
    _onReviewByConfirm(userId) {
        const messageBox = document.querySelector('message-box');
        const selectedDocuments = this._table.getSelectedRows().map(row => row.id);
        const selectedUser = userId;
        fetch(this._updateReviewByUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ document_ids: selectedDocuments, reviewer_id: selectedUser })
        }).then(response => {
            if (response.ok) {
                this._table.updateContent();
                if (messageBox) {
                    messageBox.showMessage(`Documents have been assigned successfully.`, 'success');
                }
            }
            else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to assign documents.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to assign documents.`, 'error', error.message);
        });
    }
    _onMarkAsConfirm(status) {
        const messageBox = document.querySelector('message-box');
        const selectedDocuments = this._table.getSelectedRows().map(row => row.id);
        const selectedStatus = status;
        fetch(this._updateMarkAsUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ document_ids: selectedDocuments, status: selectedStatus })
        }).then(response => {
            if (response.ok) {
                this._table.updateContent();
                if (messageBox) {
                    messageBox.showMessage(`Status has been changed successfully.`, 'success');
                }
            }
            else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to change status.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to change status.`, 'error', error.message);
        });
    }
    _onAssignToButtonClick(event) {
        this._assignToDialog.showModalWithCallback(this._onAssignToConfirm.bind(this));
    }
    _onReviewByButtonClick(event) {
        this._reviewByDialog.showModalWithCallback(this._onReviewByConfirm.bind(this));
    }
    _onMarkAsButtonClick(event) {
        this._markAsDialog.showModalWithCallback(this._onMarkAsConfirm.bind(this));
    }
}
customElements.define('project-content', ProjectContent);
