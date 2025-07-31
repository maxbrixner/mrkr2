import { LabelButton } from './base/label_button.js';
import { IconButton } from './base/icon_button.js';
import { ClassificationLabeler } from './classification_labeler.js';
export class TextLabeler extends ClassificationLabeler {
    _textLabelsContainer = document.createElement('div');
    _textContainer = document.createElement('div');
    _textLabelListContainer = document.createElement('div');
    _editButton = new IconButton();
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
        this._editButton.setAttribute("img", "/static/img/create-outline.svg");
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
        deleteButton.setAttribute("img", "/static/img/close-outline.svg");
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
    getSelection() {
        const selection = this.shadowRoot.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        if (commonAncestor != this._textContainer && !this._textContainer.contains(commonAncestor)) {
            console.error("Selection is not within the text container.");
            return null;
        }
        let start = 0;
        let end = 0;
        let startFound = false;
        let endFound = false;
        const spanNodes = this._textContainer.childNodes;
        for (let spanNode of spanNodes) {
            const textNodes = spanNode.childNodes;
            for (let textNode of textNodes) {
                if (textNode.nodeType !== Node.TEXT_NODE && !startFound) {
                    start += 1;
                }
                if (textNode.nodeType !== Node.TEXT_NODE && !endFound) {
                    end += 1;
                }
                if (textNode.nodeType !== Node.TEXT_NODE) {
                    continue;
                }
                if (textNode !== range.startContainer && !startFound) {
                    start += textNode.textContent?.length || 0;
                }
                if (textNode !== range.endContainer && !endFound) {
                    end += textNode.textContent?.length || 0;
                }
                if (textNode === range.startContainer) {
                    start += range.startOffset;
                    startFound = true;
                }
                if (textNode === range.endContainer) {
                    end += range.endOffset;
                    endFound = true;
                    break;
                }
            }
        }
        return {
            text: selection.toString(),
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
        this._textContainer.addEventListener('blur', () => {
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
        }, { once: true });
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
