interface ResizablePanesAttributes {
  orientation?: 'horizontal' | 'vertical';
  minSize?: number // must be in pixels
  startSize?: number // must be a percentage
}

class ResizablePanes extends HTMLElement implements ResizablePanesAttributes {
  public orientation: 'horizontal' | 'vertical' = 'vertical';
  public minSize: number = 100; // Default minimum size for panes in pixels
  public startSize: number = 50; // Default starting size for the first pane in percentage
  private _container: HTMLDivElement | null = null;
  private _firstPane: HTMLDivElement | null = null;
  private _secondPane: HTMLDivElement | null = null;
  private _handle: HTMLDivElement | null = null;
  private _isResizing: boolean = false;
  private _style: HTMLStyleElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._style = document.createElement('style');
    this._style.textContent = `
        :host {
          display: block;
        }

        .container {
          display: grid;
          width: 100%;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;          
        }

        .container.horizontal {
          grid-template-rows: ${this.startSize}% min-content 1fr;
        }
        
        .container.horizontal.no-select {
          cursor: row-resize;
        }

        .container.vertical {
          grid-template-columns: ${this.startSize}% min-content 1fr;
        }

        .container.vertical.no-select {
          cursor: col-resize;
        }

        .pane {
          overflow: auto;
          padding: 16px;
        }

        .handle {
          background-color: var(--border-color);
          cursor: col-resize;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }

        .handle.vertical {
          width: 1px;
          cursor: col-resize;
        }

        .handle.horizontal {
          height: 1px;
          cursor: row-resize;
        }

        .handle:hover,
        .handle:active {
          background-color: #000000; /* Darker gray on hover/active */
          border-top: 1px solid #000000;
          border-bottom: 1px solid #000000;
        }

        .no-select {
            user-select: none;
            -webkit-user-select: none;
            /* Safari */
            -moz-user-select: none;
            /* Firefox */
            -ms-user-select: none;
            /* IE/Edge */
        }
    }
    `;
    this.shadowRoot?.appendChild(this._style);

    this._container = document.createElement('div');
    this._container.classList.add('container');
    this.shadowRoot?.appendChild(this._container);
  }

  static get observedAttributes() {
    return ['orientation', 'minSize'];
  }

  private _updatePanes() {
    if (!this._container) return;
    this._container.innerHTML = '';
    this._container.classList.remove('horizontal', 'vertical');
    this._container.classList.add(this.orientation);

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

  attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;
    if (propertyName === 'orientation') {
      this.orientation = newValue as 'horizontal' | 'vertical';
    }
  }

  connectedCallback() {
    this._updatePanes();

    if (!(this._handle && this._container && this._firstPane && this._secondPane)) {
      console.error('ResizablePanes: Could not find all necessary elements in Shadow DOM.');
      return;
    }

    this._handle.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);

  }

  disconnectedCallback() {
    if (this._handle) {
      this._handle.removeEventListener('mousedown', this._onMouseDown);
    }
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  private _onMouseDown = (e: MouseEvent): void => {
    this._isResizing = true;
    e.preventDefault();
    if (!this._container || !this._firstPane || !this._secondPane || !this._handle)
      return;
    this._container.classList.add('no-select');
  };

  private _onMouseMove = (e: MouseEvent): void => {
    if (!this._isResizing || !this._container || !this._firstPane || !this._secondPane || !this._handle)
      return;

    if (this.orientation === 'vertical') {
      let newFirstWidth = e.clientX - this._container.offsetLeft;
      let newSecondWidth = this._container.offsetWidth - newFirstWidth - this._handle.offsetWidth;

      if (newFirstWidth < this.minSize) newFirstWidth = this.minSize;
      if (newSecondWidth < this.minSize) newFirstWidth = this._container.offsetWidth - this.minSize - this._handle.offsetWidth;

      this._container.style.gridTemplateColumns = `${newFirstWidth}px min-content 1fr`;
    } else {
      let newFirstHeight = e.clientY - this._container.offsetTop;
      let newSecondHeight = this._container.offsetHeight - newFirstHeight - this._handle.offsetHeight;

      if (newFirstHeight < this.minSize) newFirstHeight = this.minSize;
      if (newSecondHeight < this.minSize) newFirstHeight = this._container.offsetHeight - this.minSize - this._handle.offsetHeight;

      this._container.style.gridTemplateRows = `${newFirstHeight}px min-content 1fr`;
    }
  };

  private _onMouseUp = (): void => {
    this._isResizing = false;
    this._container?.classList.remove('no-select');
  };
}

customElements.define('resizable-panes', ResizablePanes);
