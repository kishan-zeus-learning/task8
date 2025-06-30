import { ColumnsManager } from "./ColumnsManager";
import { RowsCanvas } from "./RowsCanvas";
import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";
import { GlobalBoolean } from "./types/GlobalBoolean";

export class ResizeManager{
    private rowsManager:RowsManager;
    private tilesManager:TilesManager;
    private columnsManager:ColumnsManager;
    private ifResizeOn:{value:boolean};
    private ifResizePointerDown:{value:boolean};
    
    
    constructor(rowsManager:RowsManager,tilesManager:TilesManager,columnsManager:ColumnsManager,ifResizeOn:GlobalBoolean,ifResizePointerDown:GlobalBoolean){
        this.rowsManager=rowsManager;
        this.tilesManager=tilesManager;
        this.columnsManager=columnsManager;
        this.ifResizeOn=ifResizeOn;
        this.ifResizePointerDown=ifResizePointerDown;
        

    }

    pointerUpEventHandler(event:Event){

        document.body.style.cursor="default";
            // to be updated
        const rowCanvasDivs=document.querySelectorAll(".subRow") as NodeListOf<HTMLDivElement>;
            rowCanvasDivs.forEach(rowCanvasDiv=>{
                const resizeDiv=rowCanvasDiv.lastElementChild as HTMLDivElement;
                resizeDiv.style.display="none";
            });

            this.tilesManager.redrawRow(this.rowsManager.currentResizingRowCanvas.rowID);
            this.ifResizePointerDown.value=false;
            // this.currentRowResizeObj=null;
    }

    pointerMove(event:PointerEvent){
        if(this.ifResizeOn.value || this.ifResizePointerDown.value){
            document.body.style.cursor="ns-resize";
        }else{
            document.body.style.cursor="default";
        }

        if(this.ifResizePointerDown.value){
            // console.log("reached here: ");
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
            

        }
        
    }

    

    
}