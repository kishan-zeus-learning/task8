import { RowsCanvas } from "../RowsCanvas.js";
import { RowsManager } from "../RowsManager.js";
import { TilesManager } from "../TilesManager.js";
import { RowResizingOperation } from "../UndoRedoManager/RowResizingOperation.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

export class RowResizeEventHandler extends PointerEventHandlerBase{
    private RowDiv:HTMLDivElement;
    private rowsManager:RowsManager;
    private tilesManager:TilesManager;
    private undoRedoManager:UndoRedoManager;
    private currentCanvasObj:RowsCanvas|null;
    private rowID:number|null;
    private hoverIdx:number;
    private rowKey:number;
    private newValue:number;
    private prevValue:number;
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        undoRedoManager: UndoRedoManager
    ){
        super();
        this.rowsManager=rowsManager;
        this.tilesManager=tilesManager;
        this.undoRedoManager=undoRedoManager;
        this.RowDiv=rowsManager.rowsDivContainer;
        this.currentCanvasObj=null;
        this.rowID=null;
        this.hoverIdx=-1;
        this.rowKey=-1;
        this.newValue=rowsManager.defaultHeight;
        this.prevValue=rowsManager.defaultHeight;
    }
    hitTest(event: PointerEvent): boolean {
        const currentElement=event.target;
        if(!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;

        if(!this.RowDiv.contains(currentElement)) return false;
        this.rowID=parseInt(currentElement.getAttribute("row") as string);


        this.currentCanvasObj=this.rowsManager.getCurrentRowCanvas(this.rowID);

        if(!this.currentCanvasObj) return false;

        const currentCanvasRect=currentElement.getBoundingClientRect();

        const offsetY=event.clientY - currentCanvasRect.top;
        // this.currentCanvasObj=currentCanvas;
        this.hoverIdx=this.currentCanvasObj.binarySearchRange(offsetY);

        return this.hoverIdx!==-1;
    }

    pointerDown(event: PointerEvent): void {

        document.body.style.cursor="ns-resize";
        
        this.rowKey=(this.rowID as number)*25+1+this.hoverIdx;
        this.prevValue=this.rowsManager.rowHeights.get(this.rowKey)?.height || 25;
        this.newValue=this.prevValue;

    }

    pointerMove(event: PointerEvent): void {
        this.currentCanvasObj!.resizeRow(event.clientY,this.hoverIdx,this.rowKey);
    }

    pointerUp(event: PointerEvent): void {
        document.body.style.cursor="";
        const rowResizeOperation= new RowResizingOperation(
            this.rowKey,
            this.prevValue,
            this.currentCanvasObj!.getNewValue(),
            this.currentCanvasObj!.rowHeights,
            this.rowsManager,
            this.tilesManager,
            this.currentCanvasObj!
        );

        this.undoRedoManager.execute(rowResizeOperation);
        this.tilesManager.redrawRow(this.rowID!);
    }
}