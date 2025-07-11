/**
 * Manages undo and redo operations using stacks
 */
export class UndoRedoManager {
    constructor() {
        /**
         * Stack of operations for undoing actions
         * @type {Operation[]}
         */
        this.undoStack = [];
        /**
         * Stack of operations for redoing actions
         * @type {Operation[]}
         */
        this.redoStack = [];
    }
    /**
     * Executes an operation and pushes it onto the undo stack
     * Clears the redo stack after a new operation is executed
     *
     * @param {Operation} operation The operation to execute
     */
    execute(operation) {
        operation.redo();
        this.undoStack.push(operation);
        this.redoStack = [];
    }
    /**
     * Undoes the last operation if available
     * Moves the undone operation to the redo stack
     */
    undo() {
        if (this.undoStack.length === 0)
            return;
        const operation = this.undoStack.pop();
        operation.undo();
        this.redoStack.push(operation);
    }
    /**
     * Redoes the last undone operation if available
     * Moves the redone operation back to the undo stack
     */
    redo() {
        if (this.redoStack.length === 0)
            return;
        const operation = this.redoStack.pop();
        operation.redo();
        this.undoStack.push(operation);
    }
}
