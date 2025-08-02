/* -------------------------------------------------------------------------- */

import { ResizablePanes } from './base/resizable_panes.js';
import { DocumentViewer, PagesCreatedEvent, PageClickedEvent, HighlightClickedEvent } from './base/document_viewer.js';
import { TabContainer } from './base/tab_container.js';
import { ClassificationLabeler } from './classification_labeler.js';
import { TextLabeler } from './text_labeler.js';
import { LabelButton } from './base/label_button.js';
import { combineHexColors, getRelativeLuminance, hexToRgbAString } from './utils/color_helpers.js';
import { MessageBox } from './base/message_box.js';
import { StyledButton } from './base/styled_button.js';

/* -------------------------------------------------------------------------- */

interface LabelMakerAttributes {
    projectUrl?: string,
    documentUrl?: string,
    imageUrl?: string,
    updateUrl?: string,
    viewIcon?: string,
    openIcon?: string,
    doneIcon?: string,
    editIcon?: string,
    deleteIcon?: string
}

/* -------------------------------------------------------------------------- */

interface LabelSchema {
    id?: string // only for internal pruposes, not present in database
    name: string
}

/* -------------------------------------------------------------------------- */

interface TextLabelSchema extends LabelSchema {
    start: number
    end: number
}

/* -------------------------------------------------------------------------- */

interface PositionSchema extends LabelSchema {
    left: number
    top: number
    width: number
    height: number
}

/* -------------------------------------------------------------------------- */

interface PagePropertiesSchema {
    aspect_ratio: number
    format: string
    height: number
    mode: string
    page: number
    width: number
}

/* -------------------------------------------------------------------------- */

interface BlockLabelDataSchema {
    id: string
    position: PositionSchema
    labels: (LabelSchema | TextLabelSchema)[]
    label_status: 'done' | 'open'
    content: string
}

/* -------------------------------------------------------------------------- */

interface PageLabelDataSchema {
    id: string
    page: number
    properties: PagePropertiesSchema
    labels: LabelSchema[]
    label_status: 'done' | 'open'
    blocks: BlockLabelDataSchema[]
}

/* -------------------------------------------------------------------------- */

interface DocumentLabelDataSchema {
    labels: LabelSchema[]
    label_status: 'done' | 'open'
    pages: PageLabelDataSchema[]
}

/* -------------------------------------------------------------------------- */

interface DocumentSchema {
    id: number
    created: string
    updated: string
    path: string
    data: DocumentLabelDataSchema
}

/* -------------------------------------------------------------------------- */

interface LabelDefinitionSchema {
    type: "classification_multiple" | "classification_single" | "text"
    target: "document" | "page" | "block"
    name: string
    color: string
}

/* -------------------------------------------------------------------------- */

interface ProjectConfigSchema {
    label_definitions: LabelDefinitionSchema[]
    file_provider: any
    ocr_provider: any
}

/* -------------------------------------------------------------------------- */

interface ProjectSchema {
    id: number
    name: string
    created: string
    updated: string
    config: ProjectConfigSchema
}

/* -------------------------------------------------------------------------- */

interface ColoredSpan {
    start: number;
    end: number;
    backgroundColor: string;
    color: string;
}

/* -------------------------------------------------------------------------- */

class LabelMaker extends HTMLElement implements LabelMakerAttributes {
    private _projectUrl?: string = undefined;
    private _documentUrl?: string = undefined;
    private _imageUrl?: string = undefined
    private _updateUrl?: string = undefined;
    private _viewIcon?: string = undefined;
    private _openIcon?: string = undefined;
    private _doneIcon?: string = undefined;
    private _editIcon?: string = undefined;
    private _deleteIcon?: string = undefined;

    private _document?: DocumentSchema = undefined;
    private _project?: ProjectSchema = undefined;

    private _resizablePanes = new ResizablePanes();
    private _documentViewer = new DocumentViewer();
    private _tabContainer = new TabContainer();

    private _documentTab?: HTMLElement = undefined;
    private _pageTab?: HTMLElement = undefined;
    private _blockTab?: HTMLElement = undefined;

    private _pageLabelers: { [page: number]: ClassificationLabeler } = {};

    private _submitButton?: HTMLElement = undefined;

    get projectUrl(): string {
        return this._projectUrl || '';
    }

    set projectUrl(value: string) {
        this.setAttribute('project-url', value);
    }

    get documentUrl(): string {
        return this._documentUrl || '';
    }

    set documentUrl(value: string) {
        this.setAttribute('document-url', value);
    }

    get imageUrl(): string {
        return this._imageUrl || '';
    }

    set imageUrl(value: string) {
        this.setAttribute('image-url', value);
    }

    get updateUrl(): string {
        return this._updateUrl || '';
    }

    set updateUrl(value: string) {
        this.setAttribute('update-url', value);
    }

    get viewIcon(): string {
        return this._viewIcon || '';
    }

    set viewIcon(value: string) {
        this.setAttribute('view-icon', value);
    }

    get openIcon(): string {
        return this._openIcon || '';
    }

    set openIcon(value: string) {
        this.setAttribute('open-icon', value);
    }

    get doneIcon(): string {
        return this._doneIcon || '';
    }

    set doneIcon(value: string) {
        this.setAttribute('done-icon', value);
    }

    get editIcon(): string {
        return this._editIcon || '';
    }

    set editIcon(value: string) {
        this.setAttribute('edit-icon', value);
    }

    set deleteIcon(value: string) {
        this.setAttribute('delete-icon', value);
    }

    get deleteIcon(): string {
        return this._deleteIcon || '';
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['document-url', 'project-url', 'image-url', 'update-url', 'view-icon', 'open-icon', 'done-icon', 'edit-icon', 'delete-icon'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'document-url') {
            this._documentUrl = newValue || '';
        } else if (propertyName === 'project-url') {
            this._projectUrl = newValue || '';
        } else if (propertyName === 'image-url') {
            this._imageUrl = newValue || ''
            this._documentViewer.url = this._imageUrl;
        } else if (propertyName === 'update-url') {
            this._updateUrl = newValue || '';
        } else if (propertyName === 'view-icon') {
            this._viewIcon = newValue || '';
        } else if (propertyName === 'open-icon') {
            this._openIcon = newValue || '';
        } else if (propertyName === 'done-icon') {
            this._doneIcon = newValue || '';
        } else if (propertyName === 'edit-icon') {
            this._editIcon = newValue || '';
        } else if (propertyName === 'delete-icon') {
            this._deleteIcon = newValue || '';
        }
    }

    connectedCallback() {
        this._submitButton = document.getElementById('submit-labels') || undefined;
        this._submitButton?.addEventListener('click', this._onSubmitButtonClick());

        this.shadowRoot?.addEventListener('pages-created', this._onPagesCreated.bind(this));
        this.shadowRoot?.addEventListener('pages-load-error', this._onPagesLoadError.bind(this));
        this.shadowRoot?.addEventListener('page-clicked', this._onPageClicked.bind(this));
    }

    disconnectedCallback() {
        this._submitButton?.removeEventListener('click', this._onSubmitButtonClick());

        this.shadowRoot?.removeEventListener('pages-created', this._onPagesCreated.bind(this));
        this.shadowRoot?.addEventListener('pages-load-error', this._onPagesLoadError.bind(this));
        this.shadowRoot?.removeEventListener('page-clicked', this._onPageClicked.bind(this));
    }

    private _populateShadowRoot() {
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

        this._resizablePanes.orientation = 'vertical';
        this._resizablePanes.startsize = '50%';

        this._documentViewer.slot = 'first';
        this._resizablePanes.appendChild(this._documentViewer);

        this._tabContainer.slot = 'second';
        this._resizablePanes.appendChild(this._tabContainer);

        this.shadowRoot.appendChild(this._resizablePanes);
    }

    private _onPagesCreated(event: Event) {
        this._queryDocument()
            .then((document: DocumentSchema) => {
                this._document = document;
                if (this._document && this._project) {
                    this._addTabsToTabContainer();
                }
            })
            .catch((error: Error) => {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Unable to fetch document data.`, 'error', error.message);
                this._tabContainer.showError();
            });

        this._queryProject()
            .then((project: ProjectSchema) => {
                this._project = project;
                if (this._document && this._project) {
                    this._addTabsToTabContainer();
                }
            })
            .catch((error: Error) => {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Unable to fetch project data.`, 'error', error.message);
                this._tabContainer.showError();
            });
    }

    private _onPagesLoadError(event: Event) {
        this._tabContainer.showError();
        (document.querySelector('message-box') as MessageBox)?.showMessage(`Unable to load document content.`, 'error');
    }

    private _addTabsToTabContainer() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }

        if (this._project.config.label_definitions.some(
            (definition) => definition.target === 'document')) {
            this._documentTab = document.createElement('div');
            this._documentTab.slot = 'Document';
            this._documentTab.classList.add("tab-content");
            this._addDocumentLabelers();
            this._tabContainer.appendChild(this._documentTab);
        }

        if (this._project.config.label_definitions.some(
            (definition) => definition.target === 'page')) {
            this._pageTab = document.createElement('div');
            this._pageTab.slot = 'Page';
            this._pageTab.classList.add("tab-content");
            this._addPageLabelers();
            this._tabContainer.appendChild(this._pageTab);
        }

        if (this._project.config.label_definitions.some(
            (definition) => definition.target === 'block')) {
            this._blockTab = document.createElement('div');
            this._blockTab.slot = 'Block';
            this._blockTab.classList.add("tab-content");
            this._addBlockLabelers();
            this._tabContainer.appendChild(this._blockTab);
        }

        this._tabContainer.updateTabs();
        this._submitButton?.removeAttribute('disabled');
    }

    /* todo: from here */

    private _addDocumentLabelers() {
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
                continue; // Text labels are not permitted for documents
            }


            const labelStatus = this._document.data.labels.some(label => label.name === definition.name);

            const labelButton = classificationLabeler.addClassificationButton(
                definition.name,
                definition.color,
                definition.type,
                labelStatus,
            )
            labelButton.addEventListener('click', this._onClassificationLabelButtonClick(
                this._document.data.labels,
                definition.name,
                definition.type as "classification_multiple" | "classification_single"
            ));
        }
    }

    private _addPageLabelers() {
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
                    continue; // Text labels are not permitted for pages
                }

                const labelStatus = page.labels.some(label => label.name === definition.name);

                const labelButton = classificationLabeler.addClassificationButton(
                    definition.name,
                    definition.color,
                    definition.type,
                    labelStatus
                )

                labelButton.addEventListener('click', this._onClassificationLabelButtonClick(
                    page.labels,
                    definition.name,
                    definition.type as "classification_multiple" | "classification_single"
                ));
            }
        }
    }

    private _addBlockLabelers() {
        if (!this._document || !this._project) {
            throw new Error("Document or project data is not available.");
        }

        const labelDefinitions = this._project.config.label_definitions;


        for (const page of this._document.data.pages) {
            for (const block of page.blocks) {
                const highlight = this._documentViewer.addHighlight(
                    page.page,
                    block.position.left,
                    block.position.top,
                    block.position.width,
                    block.position.height,
                    `Block ${block.id}`,
                    block.id
                );

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

                highlight.addEventListener('click', this._onHighlightClick(textLabeler));

                this._addTextLabelsToList(textLabeler, block, labelDefinitions);

                for (const definition of labelDefinitions) {
                    if (definition.target !== 'block')
                        continue;


                    if (definition.type === 'classification_single' || definition.type === 'classification_multiple') {

                        const labelStatus = block.labels.some(label => label.name === definition.name);

                        const button = textLabeler.addClassificationButton(
                            definition.name,
                            definition.color,
                            definition.type,
                            labelStatus,
                        )

                        button.addEventListener('click', this._onClassificationLabelButtonClick(block.labels, definition.name, definition.type));
                    } else if (definition.type === 'text') {
                        const button = textLabeler.addTextLabelButton(
                            definition.name,
                            definition.color,
                            false,
                        )


                        button.addEventListener('click', this._onTextLabelButtonClick(
                            block.labels,
                            textLabeler,
                            block,
                            labelDefinitions,
                            definition.name,
                        ));

                    }
                }
            }
        }
    }

    /* todo: to here */

    private _formatBlockText(block: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[]): string {
        let content = block.content

        if (!block.labels || block.labels.length === 0) {
            content = content.replace(/\n/g, '<br>');
            return `<span>${content}</span>`;
        }

        const labels = block.labels.filter(label => 'start' in label && 'end' in label) as TextLabelSchema[];

        const points = new Set<number>([0, content.length]);
        labels.forEach(label => {
            points.add(label.start);
            points.add(label.end);
        });

        const sortedPoints = Array.from(points).sort((a, b) => a - b);

        const segments: ColoredSpan[] = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];
            const mid = (start + end) / 2;

            const overlappingLabels = labels.filter(label =>
                (label.start >= start && label.start < end) || /* start within original label */
                (label.end > start && label.end <= end) ||     /* end within original label */
                (label.start >= start && label.end <= end) ||  /* start and end within original label */
                (label.start < start && label.end > end)       /* complete overlap */
            );

            let backgroundColor = 'transparent';
            let color = '#000000';
            if (overlappingLabels.length === 1) {
                const labelColor = labelDefinitions.find(def => def.name === overlappingLabels[0].name)?.color || "#ffffff"
                backgroundColor = hexToRgbAString(labelColor, 0.5)
                const luminance = getRelativeLuminance(labelColor, 0.5);
                color = luminance < 0.5 ? '#ffffff' : '#000000'
            } else if (overlappingLabels.length > 1) {
                const colors: { [key: string]: string } = {};
                overlappingLabels.forEach(label => {
                    const definition = labelDefinitions.find(def => def.name === label.name);
                    if (definition) {
                        colors[label.name] = definition.color;
                    }
                });
                const labelColor = combineHexColors(Object.values(colors));
                backgroundColor = hexToRgbAString(labelColor, 0.5);
                const luminance = getRelativeLuminance(labelColor, 0.5);
                color = luminance < 0.5 ? '#ffffff' : '#000000'
            }

            segments.push({ start, end, backgroundColor, color });
        }

        let html = '';
        segments.forEach(segment => {
            if (segment.start < segment.end) {
                const segmentText = content.substring(segment.start, segment.end);
                if (segment.color !== 'transparent') {
                    html += `<span style="background-color: ${segment.backgroundColor}; color: ${segment.color}">${segmentText}</span>`;
                } else {
                    html += `<span>${segmentText}</span>`;
                }
            }
        });

        return html;
    }

    private _addTextLabelsToList(labeler: TextLabeler, block: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[]) {
        if (!labeler || !block || !labelDefinitions) {
            throw new Error("Labeler, block or label definitions are not available.");
        }

        for (const label of block.labels) {
            if (!('start' in label && 'end' in label)) continue;

            const definition = labelDefinitions.find(def => def.name === label.name);
            if (!definition) continue;

            const color = definition.color || '#000000';
            const content = block.content.substring(label.start, label.end);

            const labelItemContainer = labeler.addTextLabelToList(label.name, color, content);

            const labelItem = labelItemContainer[0];
            const deleteButton = labelItemContainer[1];

            const labelId = label.id || (crypto as any).randomUUID();
            label.id = labelId; // Assign ID to the label for internal use

            deleteButton.addEventListener("click", this._onTextLabelDeleteButtonClick(block, labelDefinitions, labeler, labelItem, block.labels, labelId))
        }

    }

    private _onPageClicked(event: Event) {
        const customEvent = event as CustomEvent<PageClickedEvent>;
        const associatedLabeler = this._pageLabelers[customEvent.detail.page];
        if (!associatedLabeler) {
            return // there might be no page labels
        }
        this._tabContainer.switchToTab("Page");
        associatedLabeler.scrollIntoView({ behavior: 'smooth', block: 'center' });
        associatedLabeler.classList.add('pulsing');
        associatedLabeler.addEventListener('animationend', () => {
            associatedLabeler.classList.remove('pulsing');
        }, { once: true });
    }

    private _onHighlightClick(associatedLabeler: HTMLElement): EventListener {
        return (event: Event) => {
            this._tabContainer.switchToTab("Block");

            associatedLabeler.scrollIntoView({ behavior: 'smooth', block: 'center' });
            associatedLabeler.classList.add('pulsing');
            associatedLabeler.addEventListener('animationend', () => {
                associatedLabeler.classList.remove('pulsing');
            }, { once: true });
        }
    }

    private _onClassificationLabelButtonClick(associatedLabelList: (LabelSchema | TextLabelSchema)[], labelName: string, labelType: "classification_multiple" | "classification_single"): EventListener {
        return (event: Event) => {
            const labelButton = event.currentTarget as LabelButton;
            if (!labelButton) {
                throw new Error("Label button not found in the event target.");
            }

            if (labelButton.active) {
                let i = 0;
                while (i < associatedLabelList.length) {
                    if (associatedLabelList[i].name === labelName) {
                        associatedLabelList.splice(i, 1);
                    } else {
                        i++;
                    }
                }
                labelButton.active = false;
            } else {
                associatedLabelList.push({
                    name: labelName,
                });

                if (labelType === 'classification_single') {
                    let i = 0;
                    while (i < associatedLabelList.length) {
                        if (associatedLabelList[i].name !== labelName) {
                            associatedLabelList.splice(i, 1);
                        } else {
                            i++;
                        }
                    }
                    const siblings = labelButton.parentElement?.children;
                    for (const sibling of siblings || []) {
                        if (sibling instanceof LabelButton &&
                            sibling !== labelButton) {
                            sibling.active = false;
                        }
                    }
                }
                labelButton.active = true;
            }
        }
    }

    private _onTextLabelButtonClick(associatedLabelList: (LabelSchema | TextLabelSchema)[], associatedLabeler: TextLabeler, associatedBlock: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[], labelName: string): EventListener {
        return (event: Event) => {
            const selection = associatedLabeler.getSelection();
            if (!selection || !selection.text || selection.text === '') {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Please select text first and then click on the label button`, 'info');
                return;
            }

            const existingLabel = associatedLabelList.find(label => label.name === labelName && 'start' in label && 'end' in label &&
                label.start === selection.start && label.end === selection.end);

            if (existingLabel) {
                (document.querySelector('message-box') as MessageBox)?.showMessage(`Label "${labelName}" already exists for the selected text.`, 'info');
                return;
            }

            const labelId = (crypto as any).randomUUID();

            associatedLabelList.push({
                id: labelId,
                name: labelName,
                start: selection.start,
                end: selection.end,
            });

            associatedLabeler.removeSelection();

            const color = labelDefinitions.find(def => def.name === labelName)?.color || '#000000';

            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            const labelItemContainer = associatedLabeler.addTextLabelToList(labelName, color, selection.text)

            const labelItem = labelItemContainer[0];
            const deleteButton = labelItemContainer[1];

            deleteButton.addEventListener("click", this._onTextLabelDeleteButtonClick(associatedBlock, labelDefinitions, associatedLabeler, labelItem, associatedLabelList, labelId))
        }
    }

    private _onTextLabelDeleteButtonClick(associatedBlock: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[], associatedLabeler: TextLabeler, associatedLabelItem: HTMLDivElement, associatedLabelList: (LabelSchema | TextLabelSchema)[], associatedId: string): EventListener {
        return (event: Event) => {
            const label = associatedLabelList.find(item => item.id === associatedId)
            if (!label)
                throw new Error(`Label with id ${associatedId} not found in the associated label list.`);

            const index = associatedLabelList.indexOf(label, 0)

            associatedLabelList.splice(index, 1);
            associatedLabelItem.remove();
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
        }
    }

    private _onPageViewButtonClick(page: number): EventListener {
        return (event: Event) => {
            const pageElement = this._documentViewer.getPage(page);
            if (!pageElement) {
                throw new Error(`Page ${page} not found in the document viewer.`);
            }

            pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            pageElement.classList.add('pulsing');
            pageElement.addEventListener('animationend', () => {
                pageElement.classList.remove('pulsing');
            }, { once: true });
        }
    }

    private _onBlockViewButtonClick(associatedViewerElement: HTMLElement): EventListener {
        return (event: Event) => {
            associatedViewerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            associatedViewerElement.classList.add('pulsing');
            associatedViewerElement.addEventListener('animationend', () => {
                associatedViewerElement.classList.remove('pulsing');
            }, { once: true });
        }
    }

    private _onBlockEditButtonClick(associatedLabeler: TextLabeler, associatedBlock: BlockLabelDataSchema, labelDefinitions: LabelDefinitionSchema[]): EventListener {
        return (event: Event) => {
            associatedLabeler.disableButtons();
            associatedBlock.labels.length = 0;
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            associatedLabeler.makeTextEditable(this._onBlockTextBlur(associatedBlock, associatedLabeler, labelDefinitions));
            associatedLabeler.clearLabelList();
        }
    }

    private _onBlockTextBlur(associatedBlock: BlockLabelDataSchema, associatedLabeler: TextLabeler, labelDefinitions: LabelDefinitionSchema[]) {
        return (text: string) => {
            associatedBlock.labels.length = 0;
            associatedBlock.content = text.trim();
            associatedLabeler.addText(this._formatBlockText(associatedBlock, labelDefinitions));
            associatedLabeler.enableButtons();
        }
    }

    private _onCheckButtonClick(associatedItem: DocumentLabelDataSchema | PageLabelDataSchema | BlockLabelDataSchema, associatedLabeler: ClassificationLabeler | TextLabeler): EventListener {
        return (event: Event) => {
            if (associatedItem.label_status === 'done') {
                associatedLabeler.done = false;
                associatedItem.label_status = 'open';
            } else {
                associatedLabeler.done = true;
                associatedItem.label_status = 'done';
            }
        }
    }

    private _onSubmitButtonClick(): EventListener {
        return (event: Event) => {
            (this._submitButton as StyledButton).disabled = true;
            this._submitLabelData()
                .then((success: boolean) => {
                    if (success) {
                        (document.querySelector('message-box') as MessageBox)?.showMessage(`Label data submitted successfully.`, 'success');
                    } else {
                        (document.querySelector('message-box') as MessageBox)?.showMessage(`Unable to submit label data.`, 'error', 'Server Error');
                    }
                })
                .catch((error: Error) => {
                    (document.querySelector('message-box') as MessageBox)?.showMessage(`Unable to submit label data.`, 'error', error.message);
                })
                .finally(() => {
                    (this._submitButton as StyledButton).disabled = false;
                });
        }
    }

    private async _queryDocument(): Promise<DocumentSchema> {
        if (!this.documentUrl) {
            throw new Error(`Document URL is not set`);
        }
        const response = await fetch(this.documentUrl);
        if (!response.ok) {
            throw new Error(`Document response status: ${response.status}`);
        }

        const content: DocumentSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch document data`);
        }

        return content;
    }

    private async _queryProject(): Promise<ProjectSchema> {
        if (!this.projectUrl) {
            throw new Error(`Project URL is not set`);
        }
        const response = await fetch(this.projectUrl);
        if (!response.ok) {
            throw new Error(`Project response status: ${response.status}`);
        }

        const content: ProjectSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to fetch project data`);
        }

        return content;
    }

    private async _submitLabelData(): Promise<boolean> {
        if (!this.updateUrl) {
            throw new Error(`Label data update URL is not set`);
        }
        if (!this._document || !this._document.data) {
            throw new Error(`Document data is not available`);
        }
        const response = await fetch(
            this.updateUrl,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this._document.data)
            }
        );
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const content: DocumentLabelDataSchema | null = await response.json();

        if (!content) {
            throw new Error(`Failed to submit label data`);
        }

        return (true);
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('label-maker', LabelMaker);

/* -------------------------------------------------------------------------- */