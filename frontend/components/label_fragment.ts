import { LabelButton } from './label_button.js';


interface LabelFragmentAttributes {
    heading?: string
}

interface LabelSchema {
    name: string
}

interface ColoredSpan {
    start: number;
    end: number;
    color: string;
}


interface TextLabelSchema extends LabelSchema {
    content_start: number
    content_end: number
}

export class LabelFragment extends HTMLElement implements LabelFragmentAttributes {
    public heading?: string = undefined;
    private _titleDiv: HTMLSpanElement = document.createElement('div');
    private _classificationContainer: HTMLDivElement = document.createElement('div');
    private _textLabelContainer: HTMLDivElement = document.createElement('div');
    private _textContainer: HTMLDivElement = document.createElement('div');
    private _textLabelListContainer: HTMLDivElement = document.createElement('div');
    private _textArea: HTMLDivElement = document.createElement('div');

    /**
     * Creates an instance of LabelFragment.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    /**
     * Returns an array of attribute names that this component observes.
     */
    static get observedAttributes() {
        return ['heading'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'heading') {
            this.heading = newValue || undefined;
        }

        this._populateShadowRoot();
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: grid;
                border: 1px solid var(--label-fragment-border-color);
                border-radius: var(--label-fragment-border-radius);
                user-select: none;
                grid-auto-rows: min-content;
            }
            .title {
                font-weight: 500;
                font-size: 0.9rem;
                padding: 0.5em;
                background-color: var(--label-fragment-title-background-color);
                color: var(--label-fragment-title-color);
                border-bottom: 1px solid var(--label-fragment-border-color);
            }
            .label-container {
                display: flex;
                flex-wrap: wrap;
                padding: 0.5em;
                gap: 0.5em;
                border-bottom: 1px solid var(--label-fragment-border-color);
            }
            .label-list-container {
                display: flex;
                flex-wrap: wrap;
                padding: 0.5em;
                gap: 0.5em;
                border-top: 1px solid var(--label-fragment-border-color);
            }
            .text-container {
                padding: 0.5em;
                font-size: 0.9rem;
                color: var(--label-fragment-text-color);
            }
            .text-area {
                width: 100%;
                field-sizing: content;
                border: none;
                background: transparent;
                font-family: var(--document-viewer-font-family, Arial, sans-serif);
                font-size: var(--document-viewer-font-size, 16px);
                color: var(--document-viewer-font-color, #000000);
                resize: none;
                outline: none;
                box-sizing: border-box;
                padding: 0.5rem;
                line-height: 1.5;
                white-space: pre-wrap;
                word-break: break-word;
                overflow: auto;
                transition: background-color 0.3s ease;
                user-select: text;
            }
        `;
        this.shadowRoot?.appendChild(style);

        this._titleDiv.className = "title";
        this._titleDiv.textContent = this.heading || "Label Fragment";
        this.shadowRoot?.appendChild(this._titleDiv);

        this._classificationContainer.className = "label-container";
        this._textLabelContainer.className = "label-container";
        this._textLabelListContainer.className = "label-list-container";

        this.shadowRoot?.appendChild(this._classificationContainer);
        this.shadowRoot?.appendChild(this._textLabelContainer);
        this.shadowRoot?.appendChild(this._textContainer);
        this.shadowRoot?.appendChild(this._textLabelListContainer);
    }

    public addLabelButton(
        name: string,
        color: string,
        type: string,
        active: boolean,
        targetType: "document" | "page" | "block",
        target: string
    ) {
        if (!this._classificationContainer) {
            console.error("Label container is not initialized.");
            return;
        }

        const button = new LabelButton();
        button.setAttribute("color", color);
        button.setAttribute("name", name);
        button.setAttribute("type", type);
        button.setAttribute("active", active.toString());
        button.setAttribute("target", target);
        button.setAttribute("target-type", targetType);

        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;

        button.appendChild(span);

        this._classificationContainer.appendChild(button);

    }

    public add_text_label_button(
        name: string,
        color: string,
        type: string,
        targetType: "document" | "page" | "block",
        target: string
    ) {
        if (!this._textLabelContainer) {
            console.error("Label container or text container is not initialized.");
            return;
        }

        const button = new LabelButton();
        button.setAttribute("color", color);
        button.setAttribute("name", name);
        button.setAttribute("type", type);
        button.setAttribute("target", target);
        button.setAttribute("target-type", targetType);

        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = name;

        button.appendChild(span);

        this._textLabelContainer.appendChild(button);

    }

    public add_text(text: string, text_labels: TextLabelSchema[]) {
        this._textContainer.className = "text-container";
        this._textArea.className = "text-area";

        this._textArea.innerHTML = this.generateSpans(text, text_labels, {
            'label1': '#add8e6', // hex: '#ADD8E6',
            'label2': '#90EE90', //hex: '#90EE90',
        }, 'black');

        //this._textArea.setAttribute("contenteditable", "true");
        this._textContainer.appendChild(this._textArea);
    }

    private generateSpans(text: string, labels: TextLabelSchema[], colors: Record<string, string>, neutralColor: string): string {
        if (!labels || labels.length === 0) {
            return `<span>${text}</span>`;
        }

        console.log("labels:", labels)

        const points = new Set<number>([0, text.length]);
        labels.forEach(label => {
            points.add(label.content_start);
            points.add(label.content_end);
        });

        const sortedPoints = Array.from(points).sort((a, b) => a - b);

        console.log("sorted Points:", sortedPoints);

        const segments: ColoredSpan[] = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
            const start = sortedPoints[i];
            const end = sortedPoints[i + 1];
            const mid = (start + end) / 2;

            console.log("start:", start, "end:", end, "mid:", mid);

            const overlappingLabels = labels.filter(label => mid >= label.content_start && mid < label.content_end);

            console.log("overlappingLabels:", overlappingLabels);

            let color = 'transparent'; // Default for non-labeled text
            if (overlappingLabels.length === 1) {
                color = colors[overlappingLabels[0].name] || neutralColor;
            } else if (overlappingLabels.length > 1) {
                color = this.combineHexColors(overlappingLabels.map(label => colors[label.name] || neutralColor));
            }

            segments.push({ start, end, color });
        }

        console.log("segments:", segments);

        let html = '';
        segments.forEach(segment => {
            if (segment.start < segment.end) {
                const segmentText = text.substring(segment.start, segment.end);
                if (segment.color !== 'transparent') {
                    html += `<span style="background-color: ${segment.color}">${segmentText}</span>`;
                } else {
                    html += `<span>${segmentText}</span>`;
                }
            }
        });

        return html;
    }

    disconnectedCallback() {
        //..
    }





    private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        // Remove the '#' if present
        const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

        // Check if the hex string has a valid length (3 or 6 characters)
        if (!/^[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(cleanHex)) {
            console.error(`Invalid hex color format: ${hex}`);
            return null;
        }

        let r = 0, g = 0, b = 0;

        // Handle 3-digit hex codes (e.g., #F00 becomes #FF0000)
        if (cleanHex.length === 3) {
            r = parseInt(cleanHex[0] + cleanHex[0], 16);
            g = parseInt(cleanHex[1] + cleanHex[1], 16);
            b = parseInt(cleanHex[2] + cleanHex[2], 16);
        } else if (cleanHex.length === 6) {
            r = parseInt(cleanHex.substring(0, 2), 16);
            g = parseInt(cleanHex.substring(2, 4), 16);
            b = parseInt(cleanHex.substring(4, 6), 16);
        }

        return { r, g, b };
    }

    /**
     * Converts an RGB object to a hexadecimal color string.
     * @param r The red component (0-255).
     * @param g The green component (0-255).
     * @param b The blue component (0-255).
     * @returns The hexadecimal color string (e.g., "#RRGGBB").
     */
    private rgbToHex(r: number, g: number, b: number): string {
        // Ensure values are within 0-255 range
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));

        const toHex = (c: number) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Combines an array of hexadecimal color codes by averaging their RGB components.
     * Invalid hex codes will be ignored.
     * @param hexColors An array of hexadecimal color strings (e.g., ["#FF0000", "#0000FF"]).
     * @returns The combined hexadecimal color string, or "#000000" if no valid colors are provided.
     */
    private combineHexColors(hexColors: string[]): string {
        if (hexColors.length === 0) {
            return "#000000"; // Return black if no colors are provided
        }

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let validColorCount = 0;

        for (const hex of hexColors) {
            const rgb = this.hexToRgb(hex);
            if (rgb) {
                totalR += rgb.r;
                totalG += rgb.g;
                totalB += rgb.b;
                validColorCount++;
            }
        }

        if (validColorCount === 0) {
            return "#000000"; // Return black if no valid colors were found
        }

        const avgR = totalR / validColorCount;
        const avgG = totalG / validColorCount;
        const avgB = totalB / validColorCount;

        return this.rgbToHex(avgR, avgG, avgB);
    }


}

customElements.define('label-fragment', LabelFragment);