export class KeyboardHandler {
    constructor(undoRedoManager, cellSelectionHandler) {
        this.pressedKeys = new Set();
        this.undoRedoManager = undoRedoManager;
        this.cellSelectionHandler = cellSelectionHandler;
    }
    /**
     * Handles keyboard key press
     */
    handleKeyDown(event) {
        if (this.cellSelectionHandler.isOuterInputFocused())
            return;
        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (arrowKeys.includes(event.key)) {
            event.preventDefault();
        }
        // Add key to pressed keys set
        this.pressedKeys.add(event.key);
        console.log(event.key);
        switch (event.key) {
            case "ArrowUp":
                this.cellSelectionHandler.handleArrowKey('up', this.pressedKeys.has('Shift'));
                return;
            case "ArrowDown":
                this.cellSelectionHandler.handleArrowKey('down', this.pressedKeys.has('Shift'));
                return;
            case "ArrowLeft":
                this.cellSelectionHandler.handleArrowKey('left', this.pressedKeys.has('Shift'));
                return;
            case "ArrowRight":
                this.cellSelectionHandler.handleArrowKey('right', this.pressedKeys.has('Shift'));
                return;
            case "Enter":
                this.cellSelectionHandler.handleEnterKey();
                return;
            case "Shift":
                return; // Already handled in pressedKeys
            case "Control":
                return; // Already handled in pressedKeys
            case "z":
            case "Z":
                if (this.pressedKeys.has('Control') && !this.cellSelectionHandler.isInputFocused()) {
                    this.undoRedoManager.undo();
                    return;
                }
                // Fallthrough for regular typing
                break;
            case "y":
            case "Y":
                if (this.pressedKeys.has('Control') && !this.cellSelectionHandler.isInputFocused()) {
                    this.undoRedoManager.redo();
                    return;
                }
                // Fallthrough for regular typing
                break;
            default:
                // Handle direct input for other keys
                if (!this.cellSelectionHandler.isInputFocused()) {
                    this.cellSelectionHandler.activateDirectInput();
                }
                break;
        }
    }
    /**
     * Handles keyboard key release
     */
    handleKeyUp(event) {
        this.pressedKeys.delete(event.key);
    }
    getPressedKeys() {
        return this.pressedKeys;
    }
    isKeyPressed(key) {
        return this.pressedKeys.has(key);
    }
}
