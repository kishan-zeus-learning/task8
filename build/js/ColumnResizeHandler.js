"use strict";
// import { ColumnResizingOperation } from "./UndoRedoManager/ColumnResizingOperation.js";
// import { ColumnsManager } from "./ColumnsManager.js";
// import { TilesManager } from "./TilesManager.js";
// import { BooleanObj } from "./types/BooleanObj.js";
// import { UndoRedoManager } from "./UndoRedoManager/UndoRedoManager.js";
// /**
//  * Handles column resizing operations and events.
//  */
// export class ColumnResizeHandler {
//     /** @type {ColumnsManager} Manages column operations and resizing */
//     private readonly columnsManager: ColumnsManager;
//     /** @type {TilesManager} Manages tile operations and updates */
//     private readonly tilesManager: TilesManager;
//     /** @type {BooleanObj} Indicates if column resize mode is active */
//     private readonly ifColumnResizeOn: BooleanObj;
//     /** @type {BooleanObj} Indicates if a column is currently being resized (pointer down) */
//     private readonly ifColumnResizePointerDown: BooleanObj;
//     /** @type {UndoRedoManager} Manages undo/redo operations */
//     private readonly undoRedoManager: UndoRedoManager;
//     /**
//      * Initializes the ColumnResizeHandler.
//      * 
//      * @param {ColumnsManager} columnsManager - Manager handling column operations.
//      * @param {TilesManager} tilesManager - Manager handling tile redraws.
//      * @param {BooleanObj} ifColumnResizeOn - Flag indicating if column resize is active.
//      * @param {BooleanObj} ifColumnResizePointerDown - Flag indicating if column resize is in progress.
//      * @param {UndoRedoManager} undoRedoManager - Manager for undo/redo operations.
//      */
//     constructor(
//         columnsManager: ColumnsManager,
//         tilesManager: TilesManager,
//         ifColumnResizeOn: BooleanObj,
//         ifColumnResizePointerDown: BooleanObj,
//         undoRedoManager: UndoRedoManager
//     ) {
//         this.columnsManager = columnsManager;
//         this.tilesManager = tilesManager;
//         this.ifColumnResizeOn = ifColumnResizeOn;
//         this.ifColumnResizePointerDown = ifColumnResizePointerDown;
//         this.undoRedoManager = undoRedoManager;
//     }
//     /**
//      * Handles column resize logic on pointer up event.
//      */
//     handlePointerUp(): void {
//         // Hide column resize handles
//         const columnCanvasDivs = document.querySelectorAll(".subColumn") as NodeListOf<HTMLDivElement>;
//         columnCanvasDivs.forEach(columnCanvasDiv => {
//             const resizeDiv = columnCanvasDiv.lastElementChild as HTMLDivElement;
//             resizeDiv.style.display = "none";
//         });
//         if (this.ifColumnResizePointerDown.value) {
//             const columnResizeOperation = new ColumnResizingOperation(
//                 this.columnsManager.currentResizingColumnCanvas.getColumnKey(),
//                 this.columnsManager.currentResizingColumnCanvas.getPrevValue(),
//                 this.columnsManager.currentResizingColumnCanvas.getNewValue(),
//                 this.columnsManager.currentResizingColumnCanvas.columnWidths,
//                 this.columnsManager,
//                 this.tilesManager,
//                 this.columnsManager.currentResizingColumnCanvas
//             );
//             this.undoRedoManager.execute(columnResizeOperation);
//             this.tilesManager.redrawColumn(this.columnsManager.currentResizingColumnCanvas.columnID);
//             this.ifColumnResizePointerDown.value = false;
//         }
//     }
//     /**
//      * Handles column resize logic on pointer move event.
//      * 
//      * @param {PointerEvent} event - The pointermove event.
//      */
//     handlePointerMove(event: PointerEvent): void {
//         if (this.ifColumnResizePointerDown.value) {
//             // this.columnsManager.currentResizingColumnCanvas.resizeColumn(event.clientX);
//         }
//     }
//     /**
//      * Checks if column resize is active or in progress.
//      * 
//      * @returns {boolean} True if column resize is active or pointer is down.
//      */
//     isResizing(): boolean {
//         return this.ifColumnResizeOn.value || this.ifColumnResizePointerDown.value;
//     }
// }
