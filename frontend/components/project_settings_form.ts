/* -------------------------------------------------------------------------- */

import { MessageBox } from './base/message_box.js';
import { StyledInput } from './base/styled_input.js';
import { StyledTextarea } from './base/styled_textarea.js';

/* -------------------------------------------------------------------------- */

interface ProjectSettingsFormAttributes {
    createProjectUrl?: string;
    updateProjectConfigUrl?: string;
    existingName?: string;
    existingConfig?: string;
    existing?: boolean;
}

/* -------------------------------------------------------------------------- */

export class ProjectSettingsForm extends HTMLElement implements ProjectSettingsFormAttributes {
    private _createProjectUrl: string = '';
    private _updateProjectConfigUrl: string = '';
    private _nameInput: StyledInput = new StyledInput();
    private _configTextarea: StyledTextarea = new StyledTextarea();
    private _existing: boolean = false;

    get createProjectUrl(): string {
        return this._createProjectUrl;
    }

    set createProjectUrl(value: string) {
        this.setAttribute('create-project-url', value || '');
    }

    get updateProjectConfigUrl(): string {
        return this._updateProjectConfigUrl;
    }

    set updateProjectConfigUrl(value: string) {
        this.setAttribute('update-project-config-url', value || '');
    }

    get existingName(): string {
        return this._nameInput.value;
    }

    set existingName(value: string) {
        this.setAttribute('existing-name', value || '');
    }

    get existingConfig(): string {
        return this._configTextarea.value;
    }

    set existingConfig(value: string) {
        this.setAttribute('existing-config', value || '');
    }

    get existing(): boolean {
        return this._existing;
    }

    set existing(value: boolean) {
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

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'create-project-url') {
            this._createProjectUrl = newValue || '';
        } else if (propertyName === 'update-project-config-url') {
            this._updateProjectConfigUrl = newValue || '';
        } else if (propertyName === 'existing-name') {
            console.log('Setting existing name:', newValue);
            this._nameInput.value = newValue || '';
        } else if (propertyName === 'existing-config') {
            console.log('Setting existing config:', newValue);
            try {
                const config = JSON.parse(newValue?.replace(/'/g, '"') || '{}');
                console.log('Setting existing config:', config);
                this._configTextarea.value = JSON.stringify(config, null, 2);
            } catch (e) {
                console.error('Invalid JSON format for existing config:', e);
                this._configTextarea.value = '';
            }
        } else if (propertyName === 'existing') {
            this._existing = newValue === 'true';
            if (this._existing) {
                this._nameInput.disabled = true;
            } else {
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

    private _populateShadowRoot() {
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
        `
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

    private _onNameInputChange(event: Event) {
        const input = event.target as HTMLInputElement;
    }

    private _onConfigInputChange(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
    }

    private _onConfigInputBlur(event: Event) {
        const config = this._configTextarea.value.trim();
        try {
            JSON.parse(config);
            this._configTextarea.value = JSON.stringify(JSON.parse(config), null, 2);
        } catch (e) {
            // ...
        }
    }

    private _validate(showMessage: boolean): boolean {
        const name = this._nameInput.value.trim();
        const config = this._configTextarea.value.trim();

        if (!name) {
            if (showMessage) {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Project name is required.`, 'error');
            }
            return false;
        }

        if (name.length < 3) {
            if (showMessage) {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Project name must be at least 3 characters long.`, 'error');
            }
            return false;
        }

        if (!config) {
            if (showMessage) {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Project configuration is required.`, 'error');
            }
            return false;
        }

        try {
            JSON.parse(config);
        } catch (e) {
            if (showMessage) {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Project configuration contains an invalid JSON.`, 'error');
            }
            return false;
        }

        return true;
    }

    private _onCreateProjectButtonClick() {
        if (this._existing) {
            return;
        }
        if (!this._validate(true)) {
            return;
        }
        const name = this._nameInput.value.trim();
        const config = this._configTextarea.value.trim();
        const messageBox = document.querySelector('message-box') as MessageBox;

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
            } else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to create project. This is most likely due to an invalid configuration or a project with this name already exists.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to create project. This is most likely due to a network error.`, 'error', error.message);
        });
    }

    private _onUpdateProjectButtonClick() {
        if (!this._existing) {
            return;
        }
        if (!this._validate(true)) {
            return;
        }
        const config = this._configTextarea.value.trim();
        const messageBox = document.querySelector('message-box') as MessageBox;

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
            } else {
                if (messageBox) {
                    messageBox.showMessage(`Unable to update project. This is most likely due to an invalid configuration.`, 'error', 'Server Error');
                }
            }
        }).catch(error => {
            messageBox?.showMessage(`Unable to update project. This is most likely due to a network error.`, 'error', error.message);
        });
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('project-settings-form', ProjectSettingsForm);

/* -------------------------------------------------------------------------- */