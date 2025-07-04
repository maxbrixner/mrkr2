import { LabelButton } from './label_button.js';


interface LabelFragmentAttributes {
}

export class LabelFragment extends HTMLElement implements LabelFragmentAttributes {

    constructor() {
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
        this.shadowRoot?.appendChild(style);
    }

    static get observedAttributes() {
        return [];
    }

    attributeChangedCallback() {

    }

    connectedCallback() {
    }

    public add_label_button() {

        const button = new LabelButton();
        button.setAttribute("color", "#000000");
        button.setAttribute("name", "Test");

        const span = document.createElement('span');

        span.slot = "label"
        span.textContent = "Hallo"

        button.appendChild(span)

        this.shadowRoot?.appendChild(button)

    }

    private _onClick(event: MouseEvent) {

    }

    disconnectedCallback() {
        //..
    }

}

customElements.define('label-fragment', LabelFragment);