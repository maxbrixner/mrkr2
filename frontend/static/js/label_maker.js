import { ResizablePanes } from './base/resizable_panes.js';
import { DocumentViewer } from './base/document_viewer.js';
import { TabContainer } from './base/tab_container.js';
import { ClassificationLabeler } from './classification_labeler.js';
import { TextLabeler } from './text_labeler.js';
import { LabelButton } from './base/label_button.js';
import { combineHexColors, getRelativeLuminance, hexToRgbAString } from './utils/color_helpers.js';
class LabelMaker extends HTMLElement {
    projectUrl = undefined;
    documentUrl = undefined;
    imageUrl = undefined;
    updateUrl = undefined;
    _document = undefined;
    _project = undefined;
    _resizablePanes = new ResizablePanes();
    _documentViewer = new DocumentViewer();
    _tabContainer = new TabContainer();
    _documentTab = undefined;
    _pageTab = undefined;
    _blockTab = undefined;
    _pageLabelers = {};
    _submitButton = undefined;
    _viewIcon = undefined;
    _openIcon = undefined;
    _doneIcon = undefined;
    _editIcon = undefined;
    _deleteIcon = undefined;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._populateShadowRoot();
    }
    static get observedAttributes() {
        return ['document-url', 'project-url', 'image-url', 'update-url', 'view-icon', 'open-icon', 'done-icon', 'edit-icon', 'delete-icon'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (propertyName === 'document-url') {
            this.documentUrl = newValue || undefined;
        }
        else if (propertyName === 'project-url') {
            this.projectUrl = newValue || undefined;
        }
        else if (propertyName === 'image-url') {
            this.imageUrl = newValue || undefined;
            if (this.imageUrl)
                this._documentViewer.setAttribute("url", this.imageUrl);
        }
        else if (propertyName === 'update-url') {
            this.updateUrl = newValue || undefined;
        }
        else if (propertyName === 'view-icon') {
            this._viewIcon = newValue || '';
        }
        else if (propertyName === 'open-icon') {
            this._openIcon = newValue || '';
        }
        else if (propertyName === 'done-icon') {
            this._doneIcon = newValue || '';
        }
        else if (propertyName === 'edit-icon') {
            this._editIcon = newValue || '';
        }
        else if (propertyName === 'delete-icon') {
            this._deleteIcon = newValue || '';
        }
    }
    connectedCallback() {
        this._addEventListeners();
        this._submitButton = document.getElementById('submit_labels') || undefined;
        if (!this._submitButton) {
            throw new Error("Submit button not found in the document.");
        }
        this._submitButton.addEventListener('click', this._onSubmitButtonClick());
    }
    disconnectedCallback() {
        this._removeEventListeners();
    }
    _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                height: 100%;
                overflow: hidden;
                width: 100%;
            }

            .tab-content {
                box-sizing: border-box;
                display: grid;
                gap: 1rem;
                grid-auto-rows: min-content;
                height: 100%;
                overflow-y: auto;
                padding: 1rem;
                scrollbar-color: var(--scrollbar-color, inherit);
                scrollbar-gutter: stable;
                scrollbar-width: thin;
                width: 100%;
            }

            .pulsing {
                animation: pulse .8s ease-in-out 0s 2 alternate;
            }

            @keyframes pulse {
                0% {
                    outline: 0px solid transparent;
                }

                50% {
                    outline: 3px solid var(--document-viewer-highlight-focus-outline-color);               
                }

                100% {
                    outline: 0px solid transparent;
                }
            }
        `;
        this.shadowRoot.appendChild(style);
        this._resizablePanes.setAttribute('orientation', 'vertical');
        this._resizablePanes.setAttribute('minsize', '400px');
        this._resizablePanes.setAttribute('startsize', '50%');
        this._documentViewer.slot = 'first';
        this._resizablePanes.appendChild(this._documentViewer);
        this._tabContainer.slot = 'second';
        this._resizablePanes.appendChild(this._tabContainer);
        this.shadowRoot.appendChild(this._resizablePanes);
    }
    _addEventListeners() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this.shadowRoot.addEventListener('pages-created', this._onPagesCreated.bind(this));
        this.shadowRoot.addEventListener('page-clicked', this._onPageClicked.bind(this));
    }
    _removeEventListeners() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this.shadowRoot.removeEventListener('pages-created', this._onPagesCreated.bind(this));
        this.shadowRoot.removeEventListener('page-clicked', this._onPageClicked.bind(this));
    }
    _onPagesCreated(event) {
        event.stopPropagation();
        const customEvent = event;
        this._queryContent(this._populateContent.bind(this));
    }
    _onPageClicked(event) {
        event.stopPropagation();
        const customEvent = event;
        this._tabContainer.switchToTab("Page");
        const associatedLabeler = this._pageLabelers[customEvent.detail.page];
        if (!associatedLabeler) {
            throw new Error(`Page labeler for page ${customEvent.detail.page} not found.`);
        }
        associatedLabeler.scrollIntoView({ behavior: 'smooth', block: 'center' });
        associatedLabeler.classList.add('pulsing');
        associatedLabeler.addEventListener('animationend', () => {
            associatedLabeler.classList.remove('pulsing');
        }, { once: true });
    }
    _queryContent(callback) {
        this._queryDocument()
            .then((document) => {
            this._document = document;
            if (this._document && this._project) {
                callback();
            }
        })
            .catch((error) => {
            document.querySelector('message-box')?.showMessage(`Unable to fetch document.`, 'error', error.message);
        });
        this._queryProject()
            .then((project) => {
            this._project = project;
            if (this._document && this._project) {
                callback();
            }
        })
            .catch((error) => {
            document.querySelector('message-box')?.showMessage(`Unable to fetch project.`, 'error', error.message);
        });
    }
    _populateContent() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        this._addTabsToTabContainer();
        this._submitButton?.removeAttribute('disabled');
    }
    _addTabsToTabContainer() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        if (this._project.config.label_definitions.some((definition) => definition.target === 'document')) {
            this._documentTab = document.createElement('div');
            this._documentTab.slot = 'Document';
            this._documentTab.classList.add("tab-content");
            this._addDocumentLabelers();
            this._tabContainer.appendChild(this._documentTab);
        }
        if (this._project.config.label_definitions.some((definition) => definition.target === 'page')) {
            this._pageTab = document.createElement('div');
            this._pageTab.slot = 'Page';
            this._pageTab.classList.add("tab-content");
            this._addPageLabelers();
            this._tabContainer.appendChild(this._pageTab);
        }
        if (this._project.config.label_definitions.some((definition) => definition.target === 'block')) {
            this._blockTab = document.createElement('div');
            this._blockTab.slot = 'Block';
            this._blockTab.classList.add("tab-content");
            this._addBlockLabelers();
            this._tabContainer.appendChild(this._blockTab);
        }
        this._tabContainer.updateTabs();
    }
    _addDocumentLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        if (!this._documentTab) {
            throw new Error("Document tab is not initialized.");
        }
        const classificationLabeler = new ClassificationLabeler();
        classificationLabeler.setAttribute('heading', 'Document');
        classificationLabeler.viewIcon = this._viewIcon || '';
        classificationLabeler.openIcon = this._openIcon || '';
        classificationLabeler.doneIcon = this._doneIcon || '';
        if (this._document.data.label_status === 'done') {
            classificationLabeler.setAttribute('done', 'true');
        }
        const checkButton = classificationLabeler.addCheckButton();
        checkButton.addEventListener('click', this._onCheckButtonClick(this._document.data, classificationLabeler));
        this._documentTab.appendChild(classificationLabeler);
        const labelDefinitions = this._project.config.label_definitions;
        for (const definition of labelDefinitions) {
            if (definition.target !== 'document')
                continue;
            if (definition.type === 'text') {
                continue;
            }
            const labelStatus = this._document.data.labels.some(label => label.name === definition.name);
            const labelButton = classificationLabeler.addClassificationButton(definition.name, definition.color, definition.type, labelStatus);
            labelButton.addEventListener('click', this._onClassificationLabelButtonClick(this._document.data.labels, definition.name, definition.type));
        }
    }
    _addPageLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        if (!this._pageTab) {
            throw new Error("Page tab is not initialized.");
        }
        for (const page of this._document.data.pages) {
            const classificationLabeler = new ClassificationLabeler();
            classificationLabeler.setAttribute('heading', `Page ${page.page}`);
            classificationLabeler.viewIcon = this._viewIcon || '';
            classificationLabeler.openIcon = this._openIcon || '';
            classificationLabeler.doneIcon = this._doneIcon || '';
            this._pageLabelers[page.page] = classificationLabeler;
            this._pageTab.appendChild(classificationLabeler);
            if (page.label_status === 'done') {
                classificationLabeler.setAttribute('done', 'true');
            }
            const viewButton = classificationLabeler.addViewButton();
            viewButton.addEventListener('click', this._onPageViewButtonClick(page.page));
            const checkButton = classificationLabeler.addCheckButton();
            checkButton.addEventListener('click', this._onCheckButtonClick(page, classificationLabeler));
            const labelDefinitions = this._project.config.label_definitions;
            for (const definition of labelDefinitions) {
                if (definition.target !== 'page')
                    continue;
                if (definition.type === 'text') {
                    continue;
                }
                const labelStatus = page.labels.some(label => label.name === definition.name);
                const labelButton = classificationLabeler.addClassificationButton(definition.name, definition.color, definition.type, labelStatus);
                labelButton.addEventListener('click', this._onClassificationLabelButtonClick(page.labels, definition.name, definition.type));
            }
        }
    }
    _addBlockLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }
        const labelDefinitions = this._project.config.label_definitions;
        for (const page of this._document.data.pages) {
            for (const block of page.blocks) {
                const highlight = this._documentViewer.addHighlight(page.page, block.position.left, block.position.top, block.position.width, block.position.height, `Block ${block.id}`, block.id);
                const textLabeler = new TextLabeler();
                textLabeler.setAttribute('heading', `Block`);
                textLabeler.viewIcon = this._viewIcon || '';
                textLabeler.openIcon = this._openIcon || '';
                textLabeler.doneIcon = this._doneIcon || '';
                textLabeler.editIcon = this._editIcon || '';
                textLabeler.deleteIcon = this._deleteIcon || '';
                this._blockTab?.appendChild(textLabeler);
                if (block.label_status === 'done') {
                    textLabeler.setAttribute('done', 'true');
                }
                const editButton = textLabeler.addEditButton();
                editButton.addEventListener('click', this._onBlockEditButtonClick(textLabeler, block, labelDefinitions));
                const viewButton = textLabeler.addViewButton();
                viewButton.addEventListener('click', this._onBlockViewButtonClick(highlight));
                const checkButton = textLabeler.addCheckButton();
                checkButton.addEventListener('click', this._onCheckButtonClick(block, textLabeler));
                textLabeler.addText(this._formatBlockText(block, labelDefinitions));
                highlight.addEventListener('click', this._onHighlightClick("Block", textLabeler));
                this._addTextLabelsToList(textLabeler, block, labelDefinitions);
                for (const definition of labelDefinitions) {
                    if (definition.target !== 'block')
                        continue;
                    if (definition.type === 'classification_single' || definition.type === 'classification_multiple') {
                        const labelStatus = block.labels.some(label => label.name === definition.name);
                        const button = textLabeler.addClassificationButton(definition.name, definition.color, definition.type, labelStatus);
                        button.addEventListener('click', this._onClassificationLabelButtonClick(block.labels, definition.name, definition.type));
                    }
                    else if (definition.type === 'text') {
                        const button = textLabeler.addTextLabelButton(definition.name, definition.color, false);
                        button.addEventListener('click', this._onTextLabelButtonClick(block.labels, textLabeler, block, labelDefinitions, definition.name));
                    }
                }
            }
        }
    }
    _formatBlockText(block, labelDefinitions) {
        let content = block.content;
        if (!block.labels || block.labels.length === 0) {
            content = content.replace(/\n/g, '<br>');
            return `<span>${content}</span>`;
        }
        const labels = block.labels.filter(label => 'start' in label && 'end' in label);
        const points = new Set([0, content.length]);
        labels.forEach(label => {
            points.add(label.start);
            points.add(label.end);
        });
        const sortedPoints = Array.from(points).sort((a, b) => a - b);
        const segments = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];
            const mid = (start + end) / 2;
            const overlappingLabels = labels.filter(label => mid >= label.start && mid < label.end);
            let backgroundColor = 'transparent';
            let color = '#000000';
            if (overlappingLabels.length === 1) {
                const labelColor = labelDefinitions.find(def => def.name === overlappingLabels[0].name)?.color || "#ffffff";
                backgroundColor = hexToRgbAString(labelColor, 0.5);
                const luminance = getRelativeLuminance(labelColor, 0.5);
                color = luminance < 0.5 ? '#ffffff' : '#000000';
            }
            else if (overlappingLabels.length > 1) {
                const colors = {};
                overlappingLabels.forEach(label => {
                    const definition = labelDefinitions.find(def => def.name === label.name);
                    if (definition) {
                        colors[label.name] = definition.color;
                    }
                });
                const labelColor = combineHexColors(Object.values(colors));
                backgroundColor = hexToRgbAString(labelColor, 0.5);
                const luminance = getRelativeLuminance(labelColor, 0.5);
                color = luminance < 0.5 ? '#ffffff' : '#000000';
            }
            segments.push({ start, end, backgroundColor, color });
        }
        let html = '';
        segments.forEach(segment => {
            if (segment.start < segment.end) {
                const segmentText = content.substring(segment.start, segment.end);
                if (segment.color !== 'transparent') {
                    html += `<span style="background-color: ${segment.backgroundColor}; color: ${segment.color}">${segmentText}</span>`;
                }
                else {
                    html += `<span>${segmentText}</span>`;
                }
            }
        });
        return html;
    }
    _addTextLabelsToList(labeler, block, labelDefinitions) {
        if (!labeler || !block || !labelDefinitions) {
            throw new Error("Labeler, block or label definitions are not available.");
        }
        for (const label of block.labels) {
            if (!('start' in label && 'end' in label))
                continue;
            const definition = labelDefinitions.find(def => def.name === label.name);
            if (!definition)
                continue;
            const color = definition.color || '#000000';
            const content = block.content.substring(label.start, label.end);
            const labelItemContainer = labeler.addTextLabelToList(label.name, color, content);
            const labelItem = labelItemContainer[0];
            const deleteButton = labelItemContainer[1];
            const labelId = label.id || crypto.randomUUID();
            label.id = labelId;
            deleteButton.addEventListener("click", this._onTextLabelDeleteButtonClick(block, labelDefinitions, labeler, labelItem, block.labels, labelId));
        }
    }
    _onHighlightClick(associatedTab, associatedLabeler) {
        return (event) => {
            event.stopPropagation();
            this._tabContainer.switchToTab(associatedTab);
            associatedLabeler.scrollIntoView({ behavior: 'smooth', block: 'center' });
            associatedLabeler.classList.add('pulsing');
            associatedLabeler.addEventListener('animationend', () => {
                associatedLabeler.classList.remove('pulsing');
            }, { once: true });
        };
    }
    _onClassificationLabelButtonClick(associatedLabelList, labelName, labelType) {
        return (event) => {
            event.stopPropagation();
            const labelButton = event.currentTarget;
            if (!labelButton) {
                throw new Error("Label button not found in the event target.");
            }
            const currentStatus = labelButton.getAttribute('active') || false;
            if (currentStatus === 'true') {
                let i = 0;
                while (i < associatedLabelList.length) {
                    if (associatedLabelList[i].name === labelName) {
                        associatedLabelList.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                labelButton.setAttribute('active', 'false');
            }
            else {
                associatedLabelList.push({
                    name: labelName,
                });
                if (labelType === 'classification_single') {
                    let i = 0;
                    while (i < associatedLabelList.length) {
                        if (associatedLabelList[i].name !== labelName) {
                            associatedLabelList.splice(i, 1);
                        }
                        else {
                            i++;
                        }
                    }
                    const siblings = labelButton.parentElement?.children;
                    for (const sibling of siblings || []) {
                        if (sibling instanceof LabelButton &&
                            sibling !== labelButton) {
                            sibling.setAttribute('active', 'false');
                        }
                    }
                }
                labelButton.setAttribute('active', 'true');
            }
        };
    }
    _onTextLabelButtonClick(associatedLabelList, associatedLabeler, associatedBlock, labelDefinitions, labelName) {
        return (event) => {
            event.stopPropagation();
            const selection = associatedLabeler.getSelection();
            if (!selection || !selection.text || selection.text === '') {
                document.querySelector('message-box')?.showMessage(`Please select text first and then click on the label button`, 'info');
                return;
            }
            const labelId = crypto.randomUUID();
            associatedLabelList.push({
                id: labelId,
                name: labelName,
                start: selection.start,
                end: selection.end,
            });
            associatedLabeler.removeSelection();
            const color = labelDefinitions.find(def => def.name === labelName)?.color || '#000000';
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            const labelItemContainer = associatedLabeler.addTextLabelToList(labelName, color, selection.text);
            const labelItem = labelItemContainer[0];
            const deleteButton = labelItemContainer[1];
            deleteButton.addEventListener("click", this._onTextLabelDeleteButtonClick(associatedBlock, labelDefinitions, associatedLabeler, labelItem, associatedLabelList, labelId));
        };
    }
    _onTextLabelDeleteButtonClick(associatedBlock, labelDefinitions, associatedLabeler, associatedLabelItem, associatedLabelList, associatedId) {
        return (event) => {
            event.stopPropagation();
            const label = associatedLabelList.find(item => item.id === associatedId);
            if (!label)
                throw new Error(`Label with id ${associatedId} not found in the associated label list.`);
            const index = associatedLabelList.indexOf(label, 0);
            associatedLabelList.splice(index, 1);
            associatedLabelItem.remove();
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
        };
    }
    _onPageViewButtonClick(page) {
        return (event) => {
            event.stopPropagation();
            const pageElement = this._documentViewer.getPage(page);
            if (!pageElement) {
                throw new Error(`Page ${page} not found in the document viewer.`);
            }
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            pageElement.classList.add('pulsing');
            pageElement.addEventListener('animationend', () => {
                pageElement.classList.remove('pulsing');
            }, { once: true });
        };
    }
    _onBlockViewButtonClick(associatedViewerElement) {
        return (event) => {
            event.stopPropagation();
            associatedViewerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            associatedViewerElement.classList.add('pulsing');
            associatedViewerElement.addEventListener('animationend', () => {
                associatedViewerElement.classList.remove('pulsing');
            }, { once: true });
        };
    }
    _onBlockEditButtonClick(associatedLabeler, associatedBlock, labelDefinitions) {
        return (event) => {
            event.stopPropagation();
            associatedLabeler.disableButtons();
            associatedBlock.labels.length = 0;
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            associatedLabeler.makeTextEditable(this._onBlockTextBlur(associatedBlock, associatedLabeler, labelDefinitions));
            associatedLabeler.clearLabelList();
        };
    }
    _onBlockTextBlur(associatedBlock, associatedLabeler, labelDefinitions) {
        return (text) => {
            associatedBlock.labels.length = 0;
            associatedBlock.content = text.trim();
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            associatedLabeler.enableButtons();
        };
    }
    _onCheckButtonClick(associatedItem, associatedLabeler) {
        return (event) => {
            event.stopPropagation();
            if (associatedItem.label_status === 'done') {
                associatedLabeler.setAttribute("done", "false");
                associatedItem.label_status = 'open';
            }
            else {
                associatedLabeler.setAttribute("done", "true");
                associatedItem.label_status = 'done';
            }
        };
    }
    _onSubmitButtonClick() {
        return (event) => {
            event.stopPropagation();
            this._submitButton?.setAttribute('disabled', 'true');
            this._submitLabelData()
                .then((success) => {
                if (success) {
                    document.querySelector('message-box')?.showMessage(`Label data submitted successfully.`, 'info');
                }
                else {
                    document.querySelector('message-box')?.showMessage(`Unable to submit label data.`, 'error', 'Server Error');
                }
            })
                .catch((error) => {
                document.querySelector('message-box')?.showMessage(`Unable to submit label data.`, 'error', error.message);
            })
                .finally(() => {
                this._submitButton?.removeAttribute('disabled');
            });
        };
    }
    async _queryDocument() {
        if (!this.documentUrl) {
            throw new Error(`Document URL is not set`);
        }
        const response = await fetch(this.documentUrl);
        if (!response.ok) {
            throw new Error(`Document response status: ${response.status}`);
        }
        const content = await response.json();
        if (!content) {
            throw new Error(`Failed to fetch document data`);
        }
        return content;
    }
    async _queryProject() {
        if (!this.projectUrl) {
            throw new Error(`Project URL is not set`);
        }
        const response = await fetch(this.projectUrl);
        if (!response.ok) {
            throw new Error(`Project response status: ${response.status}`);
        }
        const content = await response.json();
        if (!content) {
            throw new Error(`Failed to fetch project data`);
        }
        return content;
    }
    async _submitLabelData() {
        if (!this.updateUrl) {
            throw new Error(`Label data update URL is not set`);
        }
        if (!this._document || !this._document.data) {
            throw new Error(`Document data is not available`);
        }
        const response = await fetch(this.updateUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this._document.data)
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const content = await response.json();
        if (!content) {
            throw new Error(`Failed to submit label data`);
        }
        return (true);
    }
}
customElements.define('label-maker', LabelMaker);
