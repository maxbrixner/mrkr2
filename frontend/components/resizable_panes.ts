/* -------------------------------------------------------------------------- */

interface ResizablePanesAttributes {
    orientation?: 'horizontal' | 'vertical';
    startsize?: string
}

/* -------------------------------------------------------------------------- */

export class ResizablePanes extends HTMLElement implements ResizablePanesAttributes {
    public orientation?: 'horizontal' | 'vertical' = undefined;
    public startsize?: string = undefined;
    private _firstPane: HTMLDivElement | null = null;
    private _secondPane: HTMLDivElement | null = null;
    private _handle: HTMLDivElement | null = null;
    private _isResizing: boolean = false;

    /**
     * Creates an instance of LabelMaker.
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
        return ['orientation', 'startsize'];
    }

    /**
     * Handles changes to the attributes of the component.
     */
    attributeChangedCallback(
        propertyName: string,
        oldValue: string | null,
        newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'orientation') {
            this.orientation = newValue as 'horizontal' | 'vertical' || undefined;
        }
        if (propertyName === 'startsize') {
            this.startsize = newValue || undefined;
        }

        if (this.orientation && this.startsize) {
            this._updatePanes();
        }
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        if (!this._handle) {
            throw new Error("Handle is not initialized.");
        }

        this._handle.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        if (!this._handle) {
            throw new Error("Handle is not initialized.");
        }
        this._handle.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

    /**
     * Populates the shadow root with the component's structure.
     */
    private _populateShadowRoot() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        const style = document.createElement('style');
        style.textContent = `
            :host {
                box-sizing: border-box;
                display: grid;
                height: 100%;
                overflow: hidden;
                user-select: none; 
                width: 100%;
            }

            .pane {
                background-color: var(--resizable-panes-background-color, #ffffff);    
                display: grid;
                grid-template-columns: 1fr;
                grid-template-rows: 1fr;
                overflow: hidden;
            }

            .handle {
                background-color: var(--resizable-panes-handle-color, #000000);
                transition: background-color 0.2s ease, box-shadow 0.2s ease;
            }

            .handle.vertical {
                cursor: col-resize;
                width: var(--resizable-panes-handle-size, 1px);
            }

            .handle.horizontal {
                cursor: row-resize;
                height: var(--resizable-panes-handle-size, 1px);
            }

            .handle:hover,
            .handle:active {
                background-color: var(--resizable-panes-handle-color-hover, #000000);
            }
        }
        `;
        this.shadowRoot?.appendChild(style);

        this._firstPane = document.createElement('div');
        this._firstPane.classList.add('pane');
        const firstSlot = document.createElement('slot')
        firstSlot.name = `first`;
        this._firstPane.appendChild(firstSlot);
        this.shadowRoot.appendChild(this._firstPane);

        this._handle = document.createElement('div');
        this._handle.classList.add('handle');
        this.shadowRoot.appendChild(this._handle);

        this._secondPane = document.createElement('div');
        this._secondPane.classList.add('pane');
        const secondSlot = document.createElement('slot')
        secondSlot.name = `second`;
        this._secondPane.appendChild(secondSlot);
        this.shadowRoot.appendChild(this._secondPane);
    }

    /**
     * Updates the panes based on the current orientation, minsize, and startsize.
     */
    private _updatePanes() {
        if (!this.shadowRoot) {
            throw new Error("Shadow Root is not initialized.");
        }

        if (this.orientation === 'vertical') {
            this.style.gridTemplateColumns = `${this.startsize} min-content 1fr`;
            this._handle?.classList.remove('horizontal');
            this._handle?.classList.add('vertical');
        } else {
            this.style.gridTemplateRows = `${this.startsize} min-content 1fr`;
            this._handle?.classList.remove('vertical');
            this._handle?.classList.add('horizontal');
        }
    }

    /**
     * Handles the mouse down event on the resize handle.
     * It sets the resizing state and prevents text selection.
     */
    private _onMouseDown = (e: MouseEvent): void => {
        this._isResizing = true;
        e.preventDefault();
    };

    /**
     * Handles the mouse move event during resizing.
     * It calculates the new sizes of the panes based on the mouse position.
     * It updates the grid template of the container to reflect the new sizes.
     * It ensures that the new sizes do not go below the minimum size.
     */
    private _onMouseMove = (e: MouseEvent): void => {
        if (!this._isResizing || !this._handle)
            return;

        if (this.orientation === 'vertical') {
            let newFirstWidth = e.clientX - this.offsetLeft;
            let newSecondWidth = this.offsetWidth - newFirstWidth - this._handle.offsetWidth;

            if (newFirstWidth < 100) newFirstWidth = 100;
            if (newSecondWidth < 100) newFirstWidth = this.offsetWidth - 100 - this._handle.offsetWidth;

            this.style.gridTemplateColumns = `${newFirstWidth}px min-content 1fr`;
        } else {
            let newFirstHeight = e.clientY - this.offsetTop;
            let newSecondHeight = this.offsetHeight - newFirstHeight - this._handle.offsetHeight;

            if (newFirstHeight < 100) newFirstHeight = 100;
            if (newSecondHeight < 100) newFirstHeight = this.offsetHeight - 100 - this._handle.offsetHeight;

            this.style.gridTemplateRows = `${newFirstHeight}px min-content 1fr`;
        }
    };

    /**
     * Handles the mouse up event after resizing.
     */
    private _onMouseUp = (): void => {
        this._isResizing = false;
    };
}

/* -------------------------------------------------------------------------- */

customElements.define('resizable-panes', ResizablePanes);

/* -------------------------------------------------------------------------- */
