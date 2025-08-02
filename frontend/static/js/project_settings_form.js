import { StyledInput } from './base/styled_input.js';
import { StyledTextarea } from './base/styled_textarea.js';
export class ProjectSettingsForm extends HTMLElement {
    _createProjectUrl = '';
    _updateProjectConfigUrl = '';
    _nameInput = new StyledInput();
    _configTextarea = new StyledTextarea();
    _existing = false;
    get createProjectUrl() {
        return this._createProjectUrl;
    }
    set createProjectUrl(value) {
        this.setAttribute('create-project-url', value || '');
    }
    get updateProjectConfigUrl() {
        return this._updateProjectConfigUrl;
    }
    set updateProjectConfigUrl(value) {
        this.setAttribute('update-project-config-url', value || '');
    }
    get existingName() {
        return this._nameInput.value;
    }
    set existingName(value) {
        this.setAttribute('existing-name', value || '');
    }
    get existingConfig() {
        return this._configTextarea.value;
    }
    set existingConfig(value) {
        this.setAttribute('existing-config', value || '');
    }
    get existing() {
        return this._existing;
    }
    set existing(value) {
        this.setAttribute('existing', String(value));
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['create-project-url', 'update-project-config-url', 'existing-name', 'existing-config', 'existing'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'create-project-url') {
            this._createProjectUrl = newValue || '';
        }
        else if (propertyName === 'update-project-config-url') {
            this._updateProjectConfigUrl = newValue || '';
        }
        else if (propertyName === 'existing-name') {
            this._nameInput.value = newValue || '';
        }
        else if (propertyName === 'existing-config') {
            try {
                const config = JSON.parse(newValue?.replace(/'/g, '"') || '{}');
                this._configTextarea.value = JSON.stringify(config, null, 2);
            }
            catch (e) {
                console.error('Invalid JSON format for existing config:', e);
                this._configTextarea.value = '';
            }
        }
        else if (propertyName === 'existing') {
            this._existing = newValue === 'true';
            if (this._existing) {
                this._nameInput.disabled = true;
            }
            else {
                this._nameInput.disabled = false;
                this._configTextarea.disabled = false;
            }
        }
    }
    connectedCallback() {
        this._nameInput.addEventListener('input', this._onNameInputChange.bind(this));
        this._configTextarea.addEventListener('input', this._onConfigInputChange.bind(this));
        this._configTextarea.addEventListener('blur', this._onConfigInputBlur.bind(this));
        document.getElementById('create-project-button')?.addEventListener('click', this._onCreateProjectButtonClick.bind(this));
        document.getElementById('update-project-button')?.addEventListener('click', this._onUpdateProjectButtonClick.bind(this));
    }
    disconnectedCallback() {
        this._nameInput.removeEventListener('input', this._onNameInputChange.bind(this));
        this._configTextarea.removeEventListener('input', this._onConfigInputChange.bind(this));
        this._configTextarea.removeEventListener('blur', this._onConfigInputBlur.bind(this));
        document.getElementById('create-project-button')?.removeEventListener('click', this._onCreateProjectButtonClick.bind(this));
        document.getElementById('update-project-button')?.removeEventListener('click', this._onUpdateProjectButtonClick.bind(this));
    }
    _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const style = document.createElement('style');
        style.textContent = `
            :host {
                box-sizing: border-box;
                display: grid;
                gap: .5rem;
                grid-template-rows: auto auto auto 1fr;
                height: 100%;
                overflow-y: auto;
                padding: 2rem;
                scrollbar-color: var(--document-viewer-scrollbar-color, inherit);
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                user-select: none;
                width: 100%;
            }

            label {
                font-size: 0.8rem;
            }

            styled-input, styled-textarea {
                width: 100%;
            }

            styled-input {
                margin-bottom: 1rem;
            }

            styled-textarea {
                height: 100%;
                font-family: var(--mono-font-family, monospace);
            }
        `;
        this.shadowRoot.appendChild(style);
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Project Name';
        nameLabel.htmlFor = 'project-name';
        this.shadowRoot.appendChild(nameLabel);
        this._nameInput.id = 'project-name';
        this._nameInput.type = 'text';
        this._nameInput.placeholder = 'Project Name';
        this._nameInput.ariaLabel = 'Project Name';
        this.shadowRoot.appendChild(this._nameInput);
        const configLabel = document.createElement('label');
        configLabel.textContent = 'Project Configuration';
        configLabel.htmlFor = 'project-config';
        this.shadowRoot.appendChild(configLabel);
        this._configTextarea.id = 'project-config';
        this._configTextarea.placeholder = 'Project Configuration (JSON format)';
        this.shadowRoot.appendChild(this._configTextarea);
    }
    _onNameInputChange(event) {
        const input = event.target;
    }
    _onConfigInputChange(event) {
        const textarea = event.target;
    }
    _onConfigInputBlur(event) {
        const config = this._configTextarea.value.trim();
        try {
            JSON.parse(config);
            this._configTextarea.value = JSON.stringify(JSON.parse(config), null, 2);
        }
        catch (e) {
        }
    }
    _validate(showMessage) {
        const name = this._nameInput.value.trim();
        const config = this._configTextarea.value.trim();
        if (!name) {
            if (showMessage) {
                document.querySelector('message-box')?.showMessage(`Project name is required.`, 'error');
            }
            return false;
        }
        if (name.length < 3) {
            if (showMessage) {
                document.querySelector('message-box')?.showMessage(`Project name must be at least 3 characters long.`, 'error');
            }
            return false;
        }
        if (!config) {
            if (showMessage) {
                document.querySelector('message-box')?.showMessage(`Project configuration is required.`, 'error');
            }
            return false;
        }
        try {
            JSON.parse(config);
        }
        catch (e) {
            if (showMessage) {
                document.querySelector('message-box')?.showMessage(`Project configuration contains an invalid JSON.`, 'error');
            }
            return false;
        }
        return true;
    }
    _onCreateProjectButtonClick() {
        if (this._existing) {
            return;
        }
        if (!this._validate(true)) {
            return;
        }
        const name = this._nameInput.value.trim();
        const config = this._configTextarea.value.trim();
        const messageBox = document.querySelector('message-box');
        fetch(this._createProjectUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: this._nameInput.value, config: JSON.parse(this._configTextarea.value) })
        }).then(response => {
            if (response.ok) {
                if (messageBox) {
                    messageBox.showMessage(`Project has been created successfully.`, 'success');
                }
            }
            else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to create project. This is most likely due to an invalid configuration or a project with this name already exists.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to create project. This is most likely due to a network error.`, 'error', error.message);
        });
    }
    _onUpdateProjectButtonClick() {
        if (!this._existing) {
            return;
        }
        if (!this._validate(true)) {
            return;
        }
        const config = this._configTextarea.value.trim();
        const messageBox = document.querySelector('message-box');
        fetch(this._updateProjectConfigUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(JSON.parse(this._configTextarea.value))
        }).then(response => {
            if (response.ok) {
                if (messageBox) {
                    messageBox.showMessage(`Project has been updated successfully.`, 'success');
                }
            }
            else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to update project. This is most likely due to an invalid configuration.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to update project. This is most likely due to a network error.`, 'error', error.message);
        });
    }
}
customElements.define('project-settings-form', ProjectSettingsForm);
