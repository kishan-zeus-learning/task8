/**
 * Handles keyboard events for cell navigation, input activation,
 * and undo/redo actions within a spreadsheet-like interface.
 */
export class KeyboardHandler {
    /**
     * Initializes the KeyboardHandler
     * @param {UndoRedoManager} undoRedoManager - Manages undo/redo stack
     * @param {CellSelectionEventHandler} cellSelectionHandler - Handles cell navigation and input logic
     */
    constructor(undoRedoManager, cellSelectionHandler) {
        /** Tracks currently pressed keys */
        this.pressedKeys = new Set();
        this.undoRedoManager = undoRedoManager;
        this.cellSelectionHandler = cellSelectionHandler;
    }
    /**
     * Handles key down events for navigation and command shortcuts
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        if (this.cellSelectionHandler.isOuterInputFocused())
            return;
        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (arrowKeys.includes(event.key)) {
            event.preventDefault(); // Prevent browser default scrolling
        }
        this.pressedKeys.add(event.key);
        console.log(event.key);
        switch (event.key) {
            case "ArrowUp":
                this.cellSelectionHandler.handleArrowKey("up", this.pressedKeys.has("Shift"));
                break;
            case "ArrowDown":
                this.cellSelectionHandler.handleArrowKey("down", this.pressedKeys.has("Shift"));
                break;
            case "ArrowLeft":
                this.cellSelectionHandler.handleArrowKey("left", this.pressedKeys.has("Shift"));
                break;
            case "ArrowRight":
                this.cellSelectionHandler.handleArrowKey("right", this.pressedKeys.has("Shift"));
                break;
            case "Enter":
                this.cellSelectionHandler.handleEnterKey();
                break;
            case "Shift":
            case "Control":
                // Modifier keys are tracked but not handled directly
                break;
            case "z":
            case "Z":
                if (this.pressedKeys.has("Control") && !this.cellSelectionHandler.isInputFocused()) {
                    this.undoRedoManager.undo();
                }
                break;
            case "y":
            case "Y":
                if (this.pressedKeys.has("Control") && !this.cellSelectionHandler.isInputFocused()) {
                    this.undoRedoManager.redo();
                }
                break;
            default:
                if (!this.cellSelectionHandler.isInputFocused()) {
                    this.cellSelectionHandler.activateDirectInput();
                }
                break;
        }
    }
    /**
     * Handles key up events by removing the key from the pressedKeys set
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyUp(event) {
        this.pressedKeys.delete(event.key);
    }
    /**
     * Returns the set of currently pressed keys
     * @returns {Set<string>}
     */
    getPressedKeys() {
        return this.pressedKeys;
    }
    /**
     * Checks if a specific key is currently pressed
     * @param {string} key - Key to check
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.pressedKeys.has(key);
    }
}
