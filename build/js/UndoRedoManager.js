// UndoRedoManager that manages the stacks of operations
export class UndoRedoManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }
    execute(operation) {
        operation.redo();
        this.undoStack.push(operation);
        this.redoStack = [];
        console.log("stack : ", this.undoStack);
    }
    undo() {
        if (this.undoStack.length === 0)
            return;
        const operation = this.undoStack.pop();
        operation.undo();
        this.redoStack.push(operation);
    }
    redo() {
        if (this.redoStack.length === 0)
            return;
        const operation = this.redoStack.pop();
        operation.redo();
        this.undoStack.push(operation);
    }
}
