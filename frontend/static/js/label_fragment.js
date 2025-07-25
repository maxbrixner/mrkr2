import { LabelButton } from './label_button.js';
export class LabelFragment extends HTMLElement {
    constructor() {
        var _a;
        super();
        this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                border: 1px solid var(--label-fragment-border-color);
                height: 100px;
                border-radius: var(--label-fragment-border-radius);
                user-select: none;
            }
        `;
        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(style);
    }
    static get observedAttributes() {
        return [];
    }
    attributeChangedCallback() {
    }
    connectedCallback() {
    }
    add_label_button() {
        var _a;
        const button = new LabelButton();
        button.setAttribute("color", "#000000");
        button.setAttribute("name", "Test");
        const span = document.createElement('span');
        span.slot = "label";
        span.textContent = "Hallo";
        button.appendChild(span);
        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(button);
    }
    _onClick(event) {
    }
    disconnectedCallback() {
    }
}
customElements.define('label-fragment', LabelFragment);
