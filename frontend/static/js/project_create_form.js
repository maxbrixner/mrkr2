export class ProjectCreateForm extends ListBasedContent {
    constructor() {
        super();
        this._populateChildShadowRoot();
    }
    static get observedAttributes() {
        return [];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
    }
    connectedCallback() {
    }
    disconnectedCallback() {
    }
    _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
    }
}
customElements.define('projects-content', ProjectsContent);
