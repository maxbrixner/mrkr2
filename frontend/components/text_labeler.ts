/* -------------------------------------------------------------------------- */

import { LabelButton } from './label_button.js';
import { IconButton } from './icon_button.js';
import { ClassificationLabeler, ClassificationLabelerAttributes } from './classification_labeler.js';

/* -------------------------------------------------------------------------- */

export interface TextLabelerAttributes extends ClassificationLabelerAttributes {
    heading?: string
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

    /**
     * Creates an instance of LabelFragment.
     */
    constructor() {
        super();
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    protected _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        super._populateShadowRoot();

        this._style.textContent += `
            .text-labels-container {
                
                display: flex;
                gap: 8px;
                padding: 8px;
                flex-wrap: wrap;
            }

            .text-container {
                border-top: 1px solid var(--label-fragment-border-color);
                gap: 0.5rem;
                padding: 0.5rem;
                user-select: text;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .text-container:focus {
                outline: 1px solid var(--primary-color); /* todo */
            }   

            .text-label-list-container {
                display: grid;
                border-top: 1px solid var(--label-fragment-border-color);
                padding: 0.5rem;
                gap: 0.5rem;
                grid-template-columns: 1fr;
                grid-auto-rows: min-content;
                font-size: 0.8rem;
            }

            .text-label-list-container:empty {
                border-top: none;
                padding: 0;
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


        if (this._textContainer) {
            this._textContainer.classList.add('text-container');
            this.shadowRoot.appendChild(this._textContainer);
        }

        if (this._textLabelsContainer) {
            this._textLabelsContainer.classList.add('text-labels-container');
            this.shadowRoot.appendChild(this._textLabelsContainer);
        }

        if (this._textLabelListContainer) {
            this._textLabelListContainer.classList.add('text-label-list-container');
            this.shadowRoot.appendChild(this._textLabelListContainer);
        }

    }

    /**
     * Adds a view button to the text container.
     */
    public addText(innerHTML: string): HTMLElement {
        this._textContainer.innerHTML = innerHTML;

        return (this._textContainer);
    }

    /**
     * Adds an edit button to the text container.
     */
    public addEditButton(): HTMLElement {
        if (!this._buttonsDiv) {
            throw new Error("Classification container is not initialized.");
        }

        const button = new IconButton();
        button.setAttribute("img", "/static/img/create-outline.svg");
        button.ariaLabel = "Edit text";

        this._buttonsDiv.appendChild(button);

        return (button);
    }

    /**
     * Adds a label button to the classification container.
     */
    public addTextLabelButton(
        name: string,
        color: string,
        type: 'classification_single' | 'classification_multiple' | 'text',
        active: boolean
    ): HTMLElement {
        const button = new LabelButton();
        button.setAttribute("color", color);
        button.setAttribute("name", name);
        button.setAttribute("type", type);
        button.setAttribute("active", active.toString());
        button.ariaLabel = name;

        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;

        button.appendChild(span);

        this._textLabelsContainer.appendChild(button);

        return (button);
    }

    public addTextLabelToList(
        name: string,
        color: string,
        content: string
    ): [HTMLDivElement, IconButton] {


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
        if (!this._textLabelListContainer) {
            throw new Error("Text label list container is not initialized.");
        }
        return this._textLabelListContainer;
    }

    public getSelection(): TextSelection | null {
        const selection = (this.shadowRoot as any).getSelection();
        if (!selection || selection.rangeCount === 0) {
            return null;
        }

        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;

        // Only handle the case where the selection is within a single text node
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

    public removeSelection(): void {
        const selection = (this.shadowRoot as any).getSelection(); // Warning: this only works in Chrome-Browsers, see https://stackoverflow.com/questions/62054839/shadowroot-getselection
        if (selection) {
            selection.removeAllRanges();
        }
    }

    public makeTextEditable(onBlurCallback: CallableFunction | null = null): void {
        this._textContainer.contentEditable = 'true';
        this._textContainer.focus();
        this._textContainer.addEventListener('blur', () => {
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
        }, { once: true });
    }


}

/* -------------------------------------------------------------------------- */

customElements.define('text-labeler', TextLabeler);

/* -------------------------------------------------------------------------- */