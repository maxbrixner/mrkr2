/* -------------------------------------------------------------------------- */

import { ListBasedContent, ListBasedContentAttributes } from './list_based_content.js';
import { MessageBox } from './base/message_box.js';
import { StyledButton } from './base/styled_button.js';
import { RowClickedEvent, SelectionChangedEvent } from './base/filtered_table.js';
import { CheckboxDialog } from './base/checkbox_dialog.js';

/* -------------------------------------------------------------------------- */

interface ProjectContentAttributes extends ListBasedContentAttributes {
    labelGuiUrl?: string
    listUsersUrl?: string
    listStatusesUrl?: string
    updateAssignToUrl?: string
    updateReviewByUrl?: string
    updateMarkAsUrl?: string
}

/* -------------------------------------------------------------------------- */

export class ProjectContent extends ListBasedContent implements ProjectContentAttributes {
    private _labelGuiUrl: string = '';
    private _listUsersUrl: string = '';
    private _listStatusesUrl: string = '';
    private _updateAssignToUrl: string = '';
    private _updateReviewByUrl: string = '';
    private _updateMarkAsUrl: string = '';

    private _assignToButton: StyledButton = new StyledButton();
    private _reviewByButton: StyledButton = new StyledButton();
    private _markAsButton: StyledButton = new StyledButton();

    private _assignToDialog: CheckboxDialog = new CheckboxDialog();
    private _reviewByDialog: CheckboxDialog = new CheckboxDialog();
    private _markAsDialog: CheckboxDialog = new CheckboxDialog();

    get labelGuiUrl() {
        return this._labelGuiUrl;
    }

    set labelGuiUrl(value: string) {
        this.setAttribute('label-gui-url', value);
    }

    get listUsersUrl() {
        return this._listUsersUrl;
    }

    set listUsersUrl(value: string) {
        this.setAttribute('list-users-url', value);
    }

    get listStatusesUrl() {
        return this._listStatusesUrl;
    }

    set listStatusesUrl(value: string) {
        this.setAttribute('list-statuses-url', value);
    }

    get updateAssignToUrl() {
        return this._updateAssignToUrl;
    }

    set updateAssignToUrl(value: string) {
        this.setAttribute('update-assign-to-url', value);
    }

    get updateReviewByUrl() {
        return this._updateReviewByUrl;
    }

    set updateReviewByUrl(value: string) {
        this.setAttribute('update-review-by-url', value);
    }

    get updateMarkAsUrl() {
        return this._updateMarkAsUrl;
    }

    set updateMarkAsUrl(value: string) {
        this.setAttribute('update-mark-as-url', value);
    }

    constructor() {
        super();

        this._populateChildShadowRoot();
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'label-gui-url', 'list-users-url', 'list-statuses-url', 'update-assign-to-url', 'update-review-by-url', 'update-mark-as-url'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'label-gui-url') {
            this._labelGuiUrl = newValue || '';
        } else if (propertyName === 'list-users-url') {
            this._listUsersUrl = newValue || '';
            this._assignToDialog.contentUrl = this._listUsersUrl;
        } /* todo */
    }

    connectedCallback() {
        super.connectedCallback();
        this._assignToButton.addEventListener('click', (event: Event) => this._onAssignToButtonClick(event));
        this._reviewByButton.addEventListener('click', (event: Event) => this._onReviewByButtonClick(event));
        this._markAsButton.addEventListener('click', (event: Event) => this._onMarkAsButtonClick(event));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._assignToButton.removeEventListener('click', (event: Event) => this._onAssignToButtonClick(event));
        this._reviewByButton.removeEventListener('click', (event: Event) => this._onReviewByButtonClick(event));
        this._markAsButton.removeEventListener('click', (event: Event) => this._onMarkAsButtonClick(event));
    }

    protected _getTableConfig() {
        return '{"idColumn": "id", "headers": {"id": "ID", "path": "Path", "status": "Status", "assignee_name": "Assignee", "reviewer_name": "Reviewer", "created": "Created at", "updated": "Updated at"}, "filterElement": "filter", "display": {"status": "chip"}}';
    }

    private _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        this._assignToButton.ariaLabel = "Assign to...";
        this._assignToButton.textContent = "Assign to...";
        this._assignToButton.disabled = true;
        this._buttonsDiv.appendChild(this._assignToButton);

        this._reviewByButton.ariaLabel = "Review by...";
        this._reviewByButton.textContent = "Review by...";
        this._reviewByButton.disabled = true;
        this._buttonsDiv.appendChild(this._reviewByButton);

        this._markAsButton.ariaLabel = "Mark as...";
        this._markAsButton.textContent = "Mark as...";
        this._markAsButton.disabled = true;
        this._buttonsDiv.appendChild(this._markAsButton);

        this._assignToDialog.heading = "Assign to...";
        this._assignToDialog.contentUrl = this._listUsersUrl;
        this._assignToDialog.idField = "id";
        this._assignToDialog.displayField = "username";
        this.shadowRoot.appendChild(this._assignToDialog);

        this._reviewByDialog.heading = "Review by...";
        this._reviewByDialog.contentUrl = this._listUsersUrl;
        this.shadowRoot.appendChild(this._reviewByDialog);

        this._markAsDialog.heading = "Mark as...";
        this._markAsDialog.contentUrl = this._listStatusesUrl;
        this.shadowRoot.appendChild(this._markAsDialog);

        this._table.emptyMessage = 'No documents found';
    }

    protected _onRowClicked(event: CustomEvent<RowClickedEvent>) {
        const detail = event.detail;
        const url = "";
        if (!detail.rowId) {
            throw new Error("Row ID is not defined.");
        }
        window.location.href = this._labelGuiUrl.replace("[ID]", String(detail.rowId));
    }

    protected _onSelectionChanged(event: CustomEvent<SelectionChangedEvent>) {
        const detail = event.detail;
        this._assignToButton.disabled = detail.none;
        this._reviewByButton.disabled = detail.none;
        this._markAsButton.disabled = detail.none;
    }

    private _onAssignToButtonClick(event: Event) {
        this._assignToDialog.showModal();
    }

    private _onReviewByButtonClick(event: Event) {
        this._reviewByDialog.showModal();
    }

    private _onMarkAsButtonClick(event: Event) {
        this._markAsDialog.showModal();
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('project-content', ProjectContent);

/* -------------------------------------------------------------------------- */