/* -------------------------------------------------------------------------- */

import { LabelButton } from './base/label_button.js';
import { IconButton } from './base/icon_button.js';
import { ClassificationLabeler, ClassificationLabelerAttributes } from './classification_labeler.js';

/* -------------------------------------------------------------------------- */

export interface TextLabelerAttributes extends ClassificationLabelerAttributes {
    // ...
}

/* -------------------------------------------------------------------------- */

export interface TextSelection {
    start: number;
    end: number;
    text: string;
}

/* -------------------------------------------------------------------------- */

export class TextLabeler extends ClassificationLabeler implements ClassificationLabelerAttributes {
    private _textLabelsContainer: HTMLDivElement = document.createElement('div');
    private _textContainer: HTMLDivElement = document.createElement('div');
    private _textLabelListContainer: HTMLDivElement = document.createElement('div');
    private _editButton = new IconButton();

    constructor() {
        super();

        this._populateChildShadowRoot();
    }

    protected _populateChildShadowRoot() {
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

    public addText(innerHTML: string): HTMLElement {
        this._textContainer.innerHTML = innerHTML;

        return (this._textContainer);
    }

    public addEditButton(): HTMLElement {
        this._editButton.setAttribute("img", "/static/img/create-outline.svg");
        this._editButton.ariaLabel = "Edit text";

        this._buttonsDiv.appendChild(this._editButton);

        return (this._editButton);
    }

    public addTextLabelButton(name: string, color: string, active: boolean): HTMLElement {
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

    public addTextLabelToList(name: string, color: string, content: string): [HTMLDivElement, IconButton] {
        const labelName = document.createElement("span")
        labelName.style.color = color;
        labelName.textContent = name;

        const labelListItem = document.createElement("div");
        labelListItem.classList.add("text-label-list-item")

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


    public getLabelList(): HTMLDivElement {
        return this._textLabelListContainer;
    }

    public clearLabelList(): void {
        super.clearLabelList();
        this._textLabelListContainer.innerHTML = '';
    }

    private _getTextNodes(node: Node): Node[] {
        let textNodes: Node[] = [];
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let child of node.childNodes) {
                textNodes = textNodes.concat(this._getTextNodes(child));
            }
        }
        return textNodes;
    }

    public getSelection(): TextSelection | null {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        // Warning: this only works in Chrome-Based-Browsers,
        // see https://stackoverflow.com/questions/62054839/shadowroot-getselection
        const selection = (this.shadowRoot as any).getSelection();
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
            // before start container
            if (node !== startContainer && !startReached) {
                start += node.textContent?.length || 0;
                end += node.textContent?.length || 0;
            }

            // at start container (but not at end container)
            else if (node === startContainer && node !== endContainer) {
                startReached = true;
                start += startOffset;
                end += node.textContent?.length || 0;
                text += node.textContent?.substring(startOffset) || '';
            }

            // after start container and before end container
            else if (node !== startContainer && startReached && node !== endContainer && !endReached) {
                end += node.textContent?.length || 0;
                text += node.textContent || '';
            }

            // at end container (but not at start container)
            else if (node === endContainer && node !== startContainer) {
                endReached = true;
                end += endOffset;
                text += node.textContent?.substring(0, endOffset) || '';
                break;
            }

            // at both start and end container
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

    public removeSelection(): void {
        // Warning: this only works in Chrome-Based-Browsers,
        // see https://stackoverflow.com/questions/62054839/shadowroot-getselection
        const selection = (this.shadowRoot as any).getSelection();
        if (selection) {
            selection.removeAllRanges();
        }
    }

    /* todo */
    public makeTextEditable(onBlurCallback: CallableFunction | null = null): void {
        this._textContainer.contentEditable = 'true';
        this._textContainer.focus();
        this._textContainer.addEventListener('blur', this._onTextContainerBlur(onBlurCallback), { once: true });
    }

    protected _onTextContainerBlur(onBlurCallback: CallableFunction | null): EventListener {
        return (event: Event) => {
            this._textContainer.contentEditable = 'false';

            let text = "";
            const spanNodes = this._textContainer.childNodes;
            for (let spanNode of spanNodes) {
                const textNodes = spanNode.childNodes;

                // in empty nodes, if user adds text, the text idiotically gets inserted before the span.
                if (spanNode.nodeType == Node.TEXT_NODE) {
                    text += spanNode.textContent;
                    continue;
                }

                for (let textNode of textNodes) {
                    if (textNode.nodeType !== Node.TEXT_NODE) {
                        text += "\n"
                    } else {
                        text += textNode.textContent;
                    }
                }
            }
            if (onBlurCallback) {
                onBlurCallback(text);
            }
        }
    }

    protected _updateStatus(): void {
        super._updateStatus();

        if (this._done) {
            this._textContainer.classList.add('done');
            this._textLabelsContainer.classList.add('done');
            this._textLabelListContainer.classList.add('done');
            this._editButton.setAttribute("disabled", "true");
        } else {
            this._textContainer.classList.remove('done');
            this._textLabelsContainer.classList.remove('done');
            this._textLabelListContainer.classList.remove('done');
            this._editButton.setAttribute("disabled", "false");
        }
    }

    public disableButtons(): void {
        super.disableButtons();
        const buttons = this._textLabelsContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.setAttribute("disabled", "true");
            }
        });
    }

    public enableButtons(): void {
        super.enableButtons();
        const buttons = this._textLabelsContainer.querySelectorAll('label-button');
        buttons.forEach((button) => {
            if (button instanceof LabelButton) {
                button.removeAttribute('disabled');
            }
        });
    }

}

/* -------------------------------------------------------------------------- */

customElements.define('text-labeler', TextLabeler);

/* -------------------------------------------------------------------------- */