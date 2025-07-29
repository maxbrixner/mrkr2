/* -------------------------------------------------------------------------- */

interface ResizablePanesAttributes {
    orientation?: 'horizontal' | 'vertical';
    startsize?: string
}

/* -------------------------------------------------------------------------- */

export class ResizablePanes extends HTMLElement implements ResizablePanesAttributes {
    private _orientation?: 'horizontal' | 'vertical' = undefined
    private _startsize?: string = undefined
    private _firstPane: HTMLDivElement = document.createElement('div');
    private _secondPane: HTMLDivElement = document.createElement('div');
    private _handle: HTMLDivElement = document.createElement('div');
    private _isResizing: boolean = false;
    private _minWidth: number = 150;

    get orientation() {
        const orientation = this.getAttribute('orientation');
        return (orientation === 'horizontal' || orientation === 'vertical') ? orientation : 'vertical';
    }

    set orientation(value: 'horizontal' | 'vertical') {
        this.setAttribute('orientation', value);
    }

    get startsize() {
        return this.getAttribute('startsize') || '50%';
    }

    set startsize(value: string) {
        this.setAttribute('startsize', value || '')
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._populateShadowRoot();
    }

    static get observedAttributes() {
        return ['orientation', 'startsize'];
    }

    attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
        if (oldValue === newValue) return;

        if (propertyName === 'orientation') {
            this._orientation = newValue as 'horizontal' | 'vertical' || 'vertical';
            this._updatePanes();
        }
        if (propertyName === 'startsize') {
            this._startsize = newValue || '50%';
            this._updatePanes();
        }
    }

    connectedCallback() {
        this._handle.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    disconnectedCallback() {
        this._handle.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

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

        this._firstPane.classList.add('pane');
        const firstSlot = document.createElement('slot')
        firstSlot.name = `first`;
        this._firstPane.appendChild(firstSlot);
        this.shadowRoot.appendChild(this._firstPane);

        this._handle.classList.add('handle');
        this.shadowRoot.appendChild(this._handle);

        this._secondPane.classList.add('pane');
        const secondSlot = document.createElement('slot')
        secondSlot.name = `second`;
        this._secondPane.appendChild(secondSlot);
        this.shadowRoot.appendChild(this._secondPane);
    }

    private _updatePanes() {
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

    private _onMouseDown = (e: MouseEvent): void => {
        this._isResizing = true;
        e.preventDefault();
    };

    private _onMouseMove = (e: MouseEvent): void => {
        if (!this._isResizing || !this._handle)
            return;

        if (this.orientation === 'vertical') {
            let newFirstWidth = e.clientX - this.offsetLeft;
            let newSecondWidth = this.offsetWidth - newFirstWidth - this._handle.offsetWidth;

            if (newFirstWidth < this._minWidth) newFirstWidth = this._minWidth;
            if (newSecondWidth < this._minWidth) newFirstWidth = this.offsetWidth - this._minWidth - this._handle.offsetWidth;

            this.style.gridTemplateColumns = `${newFirstWidth}px min-content 1fr`;
        } else {
            let newFirstHeight = e.clientY - this.offsetTop;
            let newSecondHeight = this.offsetHeight - newFirstHeight - this._handle.offsetHeight;

            if (newFirstHeight < this._minWidth) newFirstHeight = this._minWidth;
            if (newSecondHeight < this._minWidth) newFirstHeight = this.offsetHeight - this._minWidth - this._handle.offsetHeight;

            this.style.gridTemplateRows = `${newFirstHeight}px min-content 1fr`;
        }
    };

    private _onMouseUp = (): void => {
        this._isResizing = false;
    };
}

/* -------------------------------------------------------------------------- */

customElements.define('resizable-panes', ResizablePanes);

/* -------------------------------------------------------------------------- */
