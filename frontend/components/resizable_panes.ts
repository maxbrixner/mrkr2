class ResizablePanes extends HTMLElement {
    // Private properties to store references to DOM elements and state
    private _container: HTMLDivElement | null = null;
    private _leftPane: HTMLDivElement | null = null;
    private _rightPane: HTMLDivElement | null = null;
    private _handle: HTMLDivElement | null = null;
    private _isResizing: boolean = false;

    constructor() {
        super(); // Always call super() first in the constructor of HTMLElement

        // Create a shadow root and attach it to the custom element
        this.attachShadow({ mode: 'open' });

        // Define the component's internal HTML structure and styles using a template literal
        this.shadowRoot!.innerHTML = `
      <style>
        /* Host element styling - ensures the component takes up space */
        :host {
          display: block; /* Important for custom elements */
          width: 100%;
          height: 300px; /* Default height, can be overridden */
        }

        /* Container for the panes */
        .resizable-panes-container {
          display: flex; /* Arranges children (panes and handle) horizontally */
          width: 100%;
          height: 100%; /* Fill the host element's height */
          border: 1px solid #e0e0e0;
          overflow: hidden; /* Important for containing content during resize */
          box-sizing: border-box; /* Include padding and border in the element's total width and height */
          border-radius: 8px; /* Rounded corners for the container */
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Subtle shadow for depth */
          font-family: 'Inter', sans-serif; /* Using Inter font as per instructions */
        }

        /* Styling for individual panes */
        .pane {
          flex-grow: 1; /* Allows panes to take up available space */
          overflow: auto; /* Adds scrollbars if content overflows */
          padding: 16px;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: background-color 0.2s ease; /* Smooth transition on hover/focus */
        }

        .pane:focus-within { /* Accessibility: highlight pane when its content is focused */
            background-color: #f0f0f0;
            outline: none;
        }

        .left-pane {
          width: 50%; /* Initial width for the left pane */
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
        }

        .right-pane {
          width: 50%; /* Initial width for the right pane */
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
        }

        /* Styling for the draggable handle */
        .resizer-handle {
          width: 8px; /* Width of the draggable handle */
          background-color: #e0e0e0; /* Light gray handle */
          cursor: ew-resize; /* Cursor indicates horizontal resizing */
          flex-shrink: 0; /* Prevents handle from shrinking */
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
          border-left: 1px solid #f0f0f0;
          border-right: 1px solid #f0f0f0;
        }

        .resizer-handle:hover,
        .resizer-handle:active {
          background-color: #bdbdbd; /* Darker gray on hover/active */
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.15); /* Subtle shadow for interaction feedback */
        }

        /* Global style to prevent text selection during drag - applied to document body */
        body.no-select {
          user-select: none;
          -webkit-user-select: none; /* Safari */
          -moz-user-select: none; /* Firefox */
          -ms-user-select: none; /* IE/Edge */
          cursor: ew-resize; /* Maintain resize cursor during drag */
        }

        h2 {
            margin-top: 0;
            color: #333;
        }

        p {
            color: #555;
            line-height: 1.5;
        }
      </style>

      <div class="resizable-panes-container">
        <div class="pane left-pane" tabindex="0">
          <h2>Left Pane</h2>
          <p>This pane contains information that can be viewed alongside content in the right pane.</p>
          <p>Drag the separator to adjust the width of these sections.</p>
        </div>
        <div class="resizer-handle"></div>
        <div class="pane right-pane" tabindex="0">
          <h2>Right Pane</h2>
          <p>Content in this pane will automatically adjust its width as you resize the window or drag the handle.</p>
          <p>Both panes are scrollable if their content overflows.</p>
        </div>
      </div>
    `;
    }

    /**
     * Called when the custom element is first connected to the document's DOM.
     * This is the place to set up event listeners and initial configurations.
     */
    connectedCallback() {
        this._container = this.shadowRoot!.querySelector('.resizable-panes-container');
        this._leftPane = this.shadowRoot!.querySelector('.left-pane');
        this._rightPane = this.shadowRoot!.querySelector('.right-pane');
        this._handle = this.shadowRoot!.querySelector('.resizer-handle');

        if (this._handle && this._container && this._leftPane && this._rightPane) {
            // Bind event handlers to the class instance to ensure 'this' refers to the component
            this._handle.addEventListener('mousedown', this._onMouseDown);
            // Mouse move and up events are listened on the document to handle cases where
            // the mouse moves off the handle while dragging
            document.addEventListener('mousemove', this._onMouseMove);
            document.addEventListener('mouseup', this._onMouseUp);

            // Initial pane width setup
            this._updatePaneWidths();
        } else {
            console.error('ResizablePanes: Could not find all necessary elements in Shadow DOM.');
        }
    }

    /**
     * Called when the custom element is disconnected from the document's DOM.
     * This is crucial for cleaning up event listeners to prevent memory leaks.
     */
    disconnectedCallback() {
        if (this._handle) {
            this._handle.removeEventListener('mousedown', this._onMouseDown);
        }
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

    /**
     * Event handler for mouse down on the resizer handle.
     * Starts the resizing process.
     * @param e MouseEvent object
     */
    private _onMouseDown = (e: MouseEvent): void => {
        this._isResizing = true;
        // Add a global class to prevent text selection during the drag operation
        document.body.classList.add('no-select');
        e.preventDefault(); // Prevent default browser drag behavior
    };

    /**
     * Event handler for mouse move.
     * Adjusts the pane widths based on mouse movement if resizing is active.
     * @param e MouseEvent object
     */
    private _onMouseMove = (e: MouseEvent): void => {
        if (!this._isResizing || !this._container || !this._leftPane || !this._rightPane || !this._handle) {
            return;
        }

        const containerRect = this._container.getBoundingClientRect();
        let newLeftWidth = e.clientX - containerRect.left;

        // Define minimum width for each pane to prevent them from collapsing
        const minWidth = 100; // pixels

        // Calculate the maximum allowed width for the left pane
        const maxLeftWidth = containerRect.width - this._handle.offsetWidth - minWidth;

        // Clamp the newLeftWidth to stay within valid bounds
        if (newLeftWidth < minWidth) {
            newLeftWidth = minWidth;
        } else if (newLeftWidth > maxLeftWidth) {
            newLeftWidth = maxLeftWidth;
        }

        // Set the new widths
        this._leftPane.style.width = `${newLeftWidth}px`;
        // The right pane's width is calculated dynamically to fill the remaining space
        this._rightPane.style.width = `${containerRect.width - newLeftWidth - this._handle.offsetWidth}px`;
    };

    /**
     * Event handler for mouse up.
     * Ends the resizing process.
     */
    private _onMouseUp = (): void => {
        this._isResizing = false;
        // Remove the global class after resizing is complete
        document.body.classList.remove('no-select');
    };

    /**
     * Sets initial pane widths or adjusts them on container resize.
     * This method ensures the panes start with a 50/50 split and remain responsive.
     */
    private _updatePaneWidths = (): void => {
        if (this._container && this._leftPane && this._rightPane && this._handle) {
            const containerWidth = this._container.offsetWidth;
            const handleWidth = this._handle.offsetWidth;
            const paneWidth = (containerWidth - handleWidth) / 2;

            this._leftPane.style.width = `${paneWidth}px`;
            this._rightPane.style.width = `${paneWidth}px`;
        }
    };
}

// Define the custom element with its tag name
// The tag name must contain a hyphen (-)
customElements.define('resizable-panes', ResizablePanes);
