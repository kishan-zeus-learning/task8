// Abstract base class for all undoable operations
export abstract class Operation {
    abstract undo(): void;
    abstract redo(): void;
}