/* -------------------------------------------------------------------------- */

import { ListBasedContent, ListBasedContentAttributes } from './list_based_content.js';
import { MessageBox } from './base/message_box.js';
import { StyledButton } from './base/styled_button.js';
import { StyledInput } from './base/styled_input.js';
import { FilteredTable, RowClickedEvent, SelectionChangedEvent, TableRenderErrorEvent } from './base/filtered_table.js';

/* -------------------------------------------------------------------------- */

interface ProjectContentAttributes extends ListBasedContentAttributes {
    projectGuiUrl?: string;
    scanUrl?: string;
}

/* -------------------------------------------------------------------------- */

export class ProjectContent extends ListBasedContent implements ProjectContentAttributes {
    private _projectGuiUrl: string = '';
    private _scanUrl: string = '';

    private _assignToButton: StyledButton = new StyledButton();
    private _reviewByButton: StyledButton = new StyledButton();
    private _markAsButton: StyledButton = new StyledButton();

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

    constructor() {
        super();

        this._populateChildShadowRoot();
    }

    static get observedAttributes() {
        return [...super.observedAttributes, 'project-gui-url', 'scan-url'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'project-gui-url') {
            this._projectGuiUrl = newValue || '';
        } else if (propertyName === 'scan-url') {
            this._scanUrl = newValue || '';
        }
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
        this._assignToButton.disabled = detail.none;
        this._reviewByButton.disabled = detail.none;
        this._markAsButton.disabled = detail.none;
    }

    private _onAssignToButtonClick(event: Event) {
        console.log("Assign to button clicked");
    }

    private _onReviewByButtonClick(event: Event) {
        console.log("Review by button clicked");
    }

    private _onMarkAsButtonClick(event: Event) {
        console.log("Mark as button clicked");
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('project-content', ProjectContent);

/* -------------------------------------------------------------------------- */