import { LabelButton } from './base/label_button.js';
import { IconButton } from './base/icon_button.js';
import { ClassificationLabeler } from './classification_labeler.js';
export class TextLabeler extends ClassificationLabeler {
    _textLabelsContainer = document.createElement('div');
    _textContainer = document.createElement('div');
    _textLabelListContainer = document.createElement('div');
    _editButton = new IconButton();
    _editIcon = undefined;
    _deleteIcon = undefined;
    get editIcon() {
        return this._editIcon || '';
    }
    set editIcon(value) {
        this.setAttribute('edit-icon', value);
    }
    get deleteIcon() {
        return this._deleteIcon || '';
    }
    set deleteIcon(value) {
        this.setAttribute('delete-icon', value);
    }
    static get observedAttributes() {
        return [...super.observedAttributes, 'edit-icon', 'delete-icon'];
    }
    attributeChangedCallback(propertyName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        super.attributeChangedCallback(propertyName, oldValue, newValue);
        if (propertyName === 'editIcon') {
            this._titleDiv.textContent = newValue || "Label Element";
        }
        else if (propertyName === 'done') {
            this._done = newValue === 'true';
            this._updateStatus();
        }
        else if (propertyName === 'viewIcon') {
            this._viewIcon = newValue || '';
            this._viewButton.setAttribute('img', this._viewIcon);
        }
        else if (propertyName === 'edit-icon') {
            this._editIcon = newValue || '';
        }
        else if (propertyName === 'delete-icon') {
            this._deleteIcon = newValue || '';
        }
    }
    constructor() {
        super();
        this._populateChildShadowRoot();
    }
    _populateChildShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        this._style.textContent += `
            .text-labels-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 8px;
                user-select: none;
            }

            .text-labels-container.done {
                display: none;
            }

            .text-container {
                border-top: 1px solid var(--labeler-border-color);
                gap: 0.5rem;
                padding: 0.5rem;
                user-select: text;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .text-container.done {
                display: none;
            }

            .text-container:focus {
                outline: var(--focus-outline);
            }   

            .text-label-list-container {
                border-top: 1px solid var(--labeler-border-color);
                display: grid;
                gap: 0.5rem;
                grid-auto-rows: min-content;
                grid-template-columns: 1fr;
                font-size: 0.8rem;
                padding: 0.5rem;
                user-select: none;
            }

            .text-label-list-container:empty {
                display: none;
            }

            .text-label-list-container.done {
                display: none;
            }
            
            .text-label-list-item {
                align-items: center;
                display: grid;
                gap: 0.5rem;
                grid-template-columns: auto 1fr min-content;
                user-select: none;
            }

            .text-label-list-item > span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        `;
        this._textContainer.classList.add('text-container');
        this.shadowRoot.appendChild(this._textContainer);
        this._textLabelsContainer.classList.add('text-labels-container');
        this.shadowRoot.appendChild(this._textLabelsContainer);
        this._textLabelListContainer.classList.add('text-label-list-container');
        this.shadowRoot.appendChild(this._textLabelListContainer);
    }
    addText(innerHTML) {
        this._textContainer.innerHTML = innerHTML;
        return (this._textContainer);
    }
    addEditButton() {
        this._editButton.setAttribute("img", this._editIcon || '');
        this._editButton.ariaLabel = "Edit text";
        this._buttonsDiv.appendChild(this._editButton);
        return (this._editButton);
    }
    addTextLabelButton(name, color, active) {
        const button = new LabelButton();
        button.setAttribute("color", color);
        button.setAttribute("name", name);
        button.setAttribute("type", "text");
        button.setAttribute("active", active.toString());
        button.ariaLabel = name;
        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;
        button.appendChild(span);
        this._textLabelsContainer.appendChild(button);
        return (button);
    }
    addTextLabelToList(name, color, content) {
        const labelName = document.createElement("span");
        labelName.style.color = color;
        labelName.textContent = name;
        const labelListItem = document.createElement("div");
        labelListItem.classList.add("text-label-list-item");
        const labelContent = document.createElement("span");
        labelContent.textContent = content;
        const deleteButton = new IconButton();
        deleteButton.setAttribute("img", this._deleteIcon || '');
        labelListItem.appendChild(labelName);
        labelListItem.appendChild(labelContent);
        labelListItem.appendChild(deleteButton);
        this._textLabelListContainer.appendChild(labelListItem);
        return ([labelListItem, deleteButton]);
    }
    getLabelList() {
        return this._textLabelListContainer;
    }
    clearLabelList() {
        super.clearLabelList();
        this._textLabelListContainer.innerHTML = '';
    }
    _getTextNodes(node) {
        let textNodes = [];
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
        }
        else if (node.nodeName === 'BR') {
            const brTextNode = document.createTextNode('\n');
            textNodes.push(brTextNode);
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let child of node.childNodes) {
                textNodes = textNodes.concat(this._getTextNodes(child));
            }
        }
        return textNodes;
    }
    getSelection() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }
        const selection = this.shadowRoot.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }
        const range = selection.getRangeAt(0);
        let startContainer = range.startContainer;
        let endContainer = range.endContainer;
        let startOffset = range.startOffset;
        let endOffset = range.endOffset;
        let textNodes = this._getTextNodes(this._textContainer);
        if (textNodes.length === 0) {
            console.error("No text nodes found in the text container.");
            return null;
        }
        if (startContainer !== this._textContainer && !this._textContainer.contains(startContainer)) {
            startContainer = textNodes[0];
            startOffset = 0;
        }
        if (endContainer !== this._textContainer && !this._textContainer.contains(endContainer)) {
            endContainer = textNodes[textNodes.length - 1];
            endOffset = endContainer.textContent.length;
        }
        if (endContainer.nodeType !== Node.TEXT_NODE) {
            endContainer = endContainer.childNodes[endOffset] || endContainer;
            endOffset = 0;
        }
        if (!textNodes.includes(startContainer) || !textNodes.includes(endContainer)) {
            throw new Error("Start or end container is not a text node in the text container.");
        }
        let startReached = false;
        let endReached = false;
        let start = 0;
        let end = 0;
        let text = '';
        for (const node of textNodes) {
            if (node !== startContainer && !startReached) {
                start += node.textContent?.length || 0;
                end += node.textContent?.length || 0;
            }
            else if (node === startContainer && node !== endContainer) {
                startReached = true;
                start += startOffset;
                end += node.textContent?.length || 0;
                text += node.textContent?.substring(startOffset) || '';
            }
            else if (node !== startContainer && startReached && node !== endContainer && !endReached) {
                end += node.textContent?.length || 0;
                text += node.textContent || '';
            }
            else if (node === endContainer && node !== startContainer) {
                endReached = true;
                end += endOffset;
                text += node.textContent?.substring(0, endOffset) || '';
                break;
            }
            else if (node === endContainer && node === startContainer) {
                startReached = true;
                endReached = true;
                start += startOffset;
                end += endOffset;
                text += node.textContent?.substring(startOffset, endOffset) || '';
                break;
            }
        }
        return {
            text: text,
            start: start,
            end: end
        };
    }
    removeSelection() {
        const selection = this.shadowRoot.getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    }
    makeTextEditable(onBlurCallback = null) {
        this._textContainer.contentEditable = 'true';
        this._textContainer.focus();
        this._textContainer.addEventListener('blur', this._onTextContainerBlur(onBlurCallback), { once: true });
    }
    _onTextContainerBlur(onBlurCallback) {
        return (event) => {
            this._textContainer.contentEditable = 'false';
            let text = "";
            const spanNodes = this._textContainer.childNodes;
            for (let spanNode of spanNodes) {
                const textNodes = spanNode.childNodes;
                if (spanNode.nodeType == Node.TEXT_NODE) {
                    text += spanNode.textContent;
                    continue;
                }
                for (let textNode of textNodes) {
                    if (textNode.nodeType !== Node.TEXT_NODE) {
                        text += "\n";
                    }
                    else {
                        text += textNode.textContent;
                    }
                }
            }
            if (onBlurCallback) {
                onBlurCallback(text);
            }
        };
    }
    _updateStatus() {
        super._updateStatus();
        if (this._done) {
            this._textContainer.classList.add('done');
            this._textLabelsContainer.classList.add('done');
            this._textLabelListContainer.classList.add('done');
            this._editButton.setAttribute("disabled", "true");
        }
        else {
            this._textContainer.classList.remove('done');
            this._textLabelsContainer.classList.remove('done');
            this._textLabelListContainer.classList.remove('done');
            this._editButton.setAttribute("disabled", "false");
        }
    }
    disableButtons() {
        super.disableButtons();
        const buttons = this._textLabelsContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.setAttribute("disabled", "true");
            }
        });
    }
    enableButtons() {
        super.enableButtons();
        const buttons = this._textLabelsContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.removeAttribute('disabled');
            }
        });
    }
}
customElements.define('text-labeler', TextLabeler);
