import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager";
import { CellSelectionEventHandler } from "./CellSelectionEventHandler";

export class KeyboardHandler {
    private pressedKeys: Set<string> = new Set();
    private undoRedoManager: UndoRedoManager;
    private cellSelectionHandler: CellSelectionEventHandler;

    constructor(undoRedoManager: UndoRedoManager, cellSelectionHandler: CellSelectionEventHandler) {
        this.undoRedoManager = undoRedoManager;
        this.cellSelectionHandler = cellSelectionHandler;
    }

    /**
     * Handles keyboard key press
     */
    handleKeyDown(event: KeyboardEvent): void {
        if (this.cellSelectionHandler.isOuterInputFocused()) return;

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
    handleKeyUp(event: KeyboardEvent): void {
        this.pressedKeys.delete(event.key);
    }

    
    getPressedKeys(): Set<string> {
        return this.pressedKeys;
    }

    
    isKeyPressed(key: string): boolean {
        return this.pressedKeys.has(key);
    }
}