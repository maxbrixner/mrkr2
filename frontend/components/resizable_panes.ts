interface ResizablePanesAttributes {
  orientation?: 'horizontal' | 'vertical';
  minsize?: number // must be in pixels
  startsize?: number // must be a percentage
}

class ResizablePanes extends HTMLElement implements ResizablePanesAttributes {
  public orientation: 'horizontal' | 'vertical' = 'vertical';
  public minsize: number = 100; // Default minimum size for panes in pixels
  public startsize: number = 50; // Default starting size for the first pane in percentage
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
    this.shadowRoot?.appendChild(this._style);

    this._container = document.createElement('div');
    this._container.classList.add('container');
    this.shadowRoot?.appendChild(this._container);
  }

  static get observedAttributes() {
    return ['orientation', 'minsize', 'startsize'];
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

    if (!this._style)
      return;

    this._style.textContent = `
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }

        .container {
          display: grid;
          width: 100%;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;          
        }

        .container.horizontal {
          grid-template-rows: ${this.startsize}% min-content 1fr;
        }
        
        .container.horizontal.no-select {
          cursor: row-resize;
        }

        .container.vertical {
          grid-template-columns: ${this.startsize}% min-content 1fr;
        }

        .container.vertical.no-select {
          cursor: col-resize;
        }

        .pane {
          display: grid;
          grid-template-rows: 1fr;
          grid-template-columns: 1fr;
          overflow: auto;
          scrollbar-gutter: stable;
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
  }

  attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;
    if (propertyName === 'orientation') {
      this.orientation = newValue as 'horizontal' | 'vertical';
    }
    if (propertyName === 'minsize') {
      this.minsize = parseInt(newValue || '100', 10);
    }
    if (propertyName === 'startsize') {
      this.startsize = parseInt(newValue || '50', 10);
    }
    this._updatePanes();
  }

  connectedCallback() {
    if (!(this._handle && this._container && this._firstPane && this._secondPane)) {
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

      if (newFirstWidth < this.minsize) newFirstWidth = this.minsize;
      if (newSecondWidth < this.minsize) newFirstWidth = this._container.offsetWidth - this.minsize - this._handle.offsetWidth;

      this._container.style.gridTemplateColumns = `${newFirstWidth}px min-content 1fr`;
    } else {
      let newFirstHeight = e.clientY - this._container.offsetTop;
      let newSecondHeight = this._container.offsetHeight - newFirstHeight - this._handle.offsetHeight;

      if (newFirstHeight < this.minsize) newFirstHeight = this.minsize;
      if (newSecondHeight < this.minsize) newFirstHeight = this._container.offsetHeight - this.minsize - this._handle.offsetHeight;

      this._container.style.gridTemplateRows = `${newFirstHeight}px min-content 1fr`;
    }
  };

  private _onMouseUp = (): void => {
    this._isResizing = false;
    this._container?.classList.remove('no-select');
  };
}

customElements.define('resizable-panes', ResizablePanes);
