interface ResizablePanesAttributes {
  orientation: 'horizontal' | 'vertical'
}

class ResizablePanes extends HTMLElement implements ResizablePanesAttributes {
  public orientation: 'horizontal' | 'vertical' = 'horizontal';
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
          grid-template-columns: auto auto 1fr; /* Two panes with a handle in between */
          width: 100%;
          height: 100%;
          overflow: hidden; /* Important for containing content during resize */
          box-sizing: border-box;
        }

        .pane {
          overflow: auto;
          padding: 16px;
        }

        .handle {
          width: 1px;
          background-color: var(--border-color); /* Light gray handle */
          cursor: col-resize; /* Cursor indicates horizontal resizing */
          flex-shrink: 0; /* Prevents handle from shrinking */
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
          border-top: 1px solid var(--background-color);
          border-bottom: 1px solid var(--background-color);
        }

        .handle:hover,
        .handle:active {
          background-color: #000000; /* Darker gray on hover/active */
          border-top: 1px solid #000000;
          border-bottom: 1px solid #000000;
        }


    `;
    this.shadowRoot?.appendChild(this._style);

    this._container = document.createElement('div');
    this._container.classList.add('container');
    this.shadowRoot?.appendChild(this._container);
  }

  static get observedAttributes() {
    return ['orientation'];
  }

  private _updatePanes() {
    if (!this._container) return;
    this._container.innerHTML = ''; // Clear existing content

    this._firstPane = document.createElement('div');
    this._firstPane.classList.add('pane');
    const firstSlot = document.createElement('slot')
    firstSlot.name = `first`;
    this._firstPane.appendChild(firstSlot);
    this._container.appendChild(this._firstPane);

    this._handle = document.createElement('div');
    this._handle.classList.add('handle');
    this._container.appendChild(this._handle);

    this._secondPane = document.createElement('div');
    this._secondPane.classList.add('pane');
    const secondSlot = document.createElement('slot')
    secondSlot.name = `second`;
    this._secondPane.appendChild(secondSlot);
    this._container.appendChild(this._secondPane);
  }

  attributeChangedCallback(propertyName: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return; // No change, no action needed
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

    // Initial pane width setup
    this._updatePaneWidths();
  }

  disconnectedCallback() {
    if (this._handle) {
      this._handle.removeEventListener('mousedown', this._onMouseDown);
    }
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
  }

  private _onMouseDown = (e: MouseEvent): void => {
    console.log('Mouse down on handle');
    this._isResizing = true;
    document.body.classList.add('no-select');
    e.preventDefault();
  };

  private _onMouseMove = (e: MouseEvent): void => {
    if (!this._isResizing || !this._container || !this._firstPane || !this._secondPane || !this._handle)
      return;

    console.log('Mouse move on handle');

    const minWidth = 100;

    console.log(`Container width: ${this._container.offsetWidth}, Handle width: ${this._handle.offsetWidth}`);
    console.log(`Mouse position: ${e.clientX}, Container offset: ${this._container.offsetLeft}`);

    let newFirstWidth = e.clientX - this._container.offsetLeft;
    let newSecondWidth = this._container.offsetWidth - newFirstWidth - this._handle.offsetWidth;

    console.log(`New widths - First: ${newFirstWidth}, Second: ${newSecondWidth}`);

    if (newFirstWidth < minWidth) newFirstWidth = minWidth;
    if (newSecondWidth < minWidth) newFirstWidth = this._container.offsetWidth - minWidth - this._handle.offsetWidth;

    this._container.style.gridTemplateColumns = `${newFirstWidth}px min-content 1fr`;

  };

  private _onMouseUp = (): void => {
    this._isResizing = false;
    document.body.classList.remove('no-select');
  };

  private _updatePaneWidths = (): void => {
    console.log('Updating pane widths');
    if (!(this._container && this._firstPane && this._secondPane && this._handle))
      return;
  };
}

customElements.define('resizable-panes', ResizablePanes);
