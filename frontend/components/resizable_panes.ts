/* -------------------------------------------------------------------------- */

interface ResizablePanesAttributes {
    orientation?: 'horizontal' | 'vertical';
    startsize?: string
}

/* -------------------------------------------------------------------------- */

export class ResizablePanes extends HTMLElement implements ResizablePanesAttributes {
    public orientation?: 'horizontal' | 'vertical' = undefined;
    public startsize?: string = undefined;
    private _container: HTMLDivElement | null = null;
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
            this.orientation = newValue as 'horizontal' | 'vertical' || 'horizontal';
        }
        if (propertyName === 'startsize') {
            this.startsize = newValue || '50%';
        }
        this._updatePanes();
    }

    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback() {
        if (!(this._handle && this._container && this._firstPane && this._secondPane)) {
            return;
        }

        this._handle.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback() {
        if (this._handle) {
            this._handle.removeEventListener('mousedown', this._onMouseDown);
        }
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
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
                display: block;
                overflow: hidden;
            }

            .container {
                display: grid;
                width: 100%;
                height: 100%;
                overflow: hidden;
                box-sizing: border-box;          
            }

            .container.horizontal.no-select {
                cursor: row-resize;
            }

            .container.vertical.no-select {
                cursor: col-resize;
            }

            .pane {
                display: grid;
                grid-template-rows: 1fr;
                grid-template-columns: 1fr;
                overflow: hidden;
                background-color: var(--resizable-pane-background-color, #f0f0f0);
            }

            .handle {
                background-color: var(--resizable-pane-handle-color, #000000);
                cursor: col-resize;
                transition: background-color 0.2s ease, box-shadow 0.2s ease;
            }

            .handle.vertical {
                width: var(--resizable-pane-handle-size, 1px);
                cursor: col-resize;
            }

            .handle.horizontal {
                height: var(--resizable-pane-handle-size, 1px);
                cursor: row-resize;
            }

            .handle:hover,
            .handle:active {
                background-color: var(--resizable-pane-handle-color-hover, #000000);
            }

            .no-select {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }
        }
        `;
        this.shadowRoot?.appendChild(style);

        this._container = document.createElement('div');
        this._container.classList.add('container');
        this.shadowRoot?.appendChild(this._container);
    }

    /**
     * Updates the panes based on the current orientation, minsize, and startsize.
     */
    private _updatePanes() {
        if (!this.orientation || !this.startsize) {
            return;
        }
        if (!this._container) return;

        this._container.innerHTML = '';

        if (this.orientation === 'vertical') {
            this._container.style.gridTemplateColumns = `${this.startsize} min-content 1fr`;
        } else {
            this._container.style.gridTemplateRows = `${this.startsize} min-content 1fr`;
        }

        this._firstPane = document.createElement('div');
        this._firstPane.classList.add('pane');
        const firstSlot = document.createElement('slot')
        firstSlot.name = `first`;
        this._firstPane.appendChild(firstSlot);
        this._container.appendChild(this._firstPane);

        this._handle = document.createElement('div');
        this._handle.classList.add('handle');
        this._handle.classList.add(this.orientation);
        this._container.appendChild(this._handle);

        this._secondPane = document.createElement('div');
        this._secondPane.classList.add('pane');
        const secondSlot = document.createElement('slot')
        secondSlot.name = `second`;
        this._secondPane.appendChild(secondSlot);
        this._container.appendChild(this._secondPane);
    }

    /**
     * Handles the mouse down event on the resize handle.
     * It sets the resizing state and prevents text selection.
     */
    private _onMouseDown = (e: MouseEvent): void => {
        this._isResizing = true;
        e.preventDefault();
        if (!this._container || !this._firstPane || !this._secondPane || !this._handle)
            return;
        this._container.classList.add('no-select');
    };

    /**
     * Handles the mouse move event during resizing.
     * It calculates the new sizes of the panes based on the mouse position.
     * It updates the grid template of the container to reflect the new sizes.
     * It ensures that the new sizes do not go below the minimum size.
     */
    private _onMouseMove = (e: MouseEvent): void => {
        if (!this._isResizing || !this._container || !this._firstPane || !this._secondPane || !this._handle)
            return;

        if (this.orientation === 'vertical') {
            let newFirstWidth = e.clientX - this._container.offsetLeft;
            let newSecondWidth = this._container.offsetWidth - newFirstWidth - this._handle.offsetWidth;

            if (newFirstWidth < 100) newFirstWidth = 100;
            if (newSecondWidth < 100) newFirstWidth = this._container.offsetWidth - 100 - this._handle.offsetWidth;

            this._container.style.gridTemplateColumns = `${newFirstWidth}px min-content 1fr`;
        } else {
            let newFirstHeight = e.clientY - this._container.offsetTop;
            let newSecondHeight = this._container.offsetHeight - newFirstHeight - this._handle.offsetHeight;

            if (newFirstHeight < 100) newFirstHeight = 100;
            if (newSecondHeight < 100) newFirstHeight = this._container.offsetHeight - 100 - this._handle.offsetHeight;

            this._container.style.gridTemplateRows = `${newFirstHeight}px min-content 1fr`;
        }
    };

    /**
     * Handles the mouse up event after resizing.
     * It resets the resizing state and removes the no-select class from the container.
     */
    private _onMouseUp = (): void => {
        this._isResizing = false;
        this._container?.classList.remove('no-select');
    };
}

/* -------------------------------------------------------------------------- */

customElements.define('resizable-panes', ResizablePanes);

/* -------------------------------------------------------------------------- */
