import { Operation } from "./types/Operation";

// UndoRedoManager that manages the stacks of operations
export class UndoRedoManager {
    private undoStack: Operation[] = [];
    private redoStack: Operation[] = [];

    execute(operation: Operation) {
        operation.redo();            
        this.undoStack.push(operation);
        this.redoStack = [];     
        console.log("stack : ",this.undoStack);   
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const operation = this.undoStack.pop()!;
        operation.undo();
        this.redoStack.push(operation);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const operation = this.redoStack.pop()!;
        operation.redo();
        this.undoStack.push(operation);
    }
}