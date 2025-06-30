import { ColumnsManager } from "./ColumnsManager";
import { RowsCanvas } from "./RowsCanvas";
import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";
import { GlobalBoolean } from "./types/GlobalBoolean";

export class ResizeManager{
    private rowsManager:RowsManager;
    private tilesManager:TilesManager;
    private columnsManager:ColumnsManager;
    private ifRowResizeOn:GlobalBoolean;
    private ifRowResizePointerDown:GlobalBoolean;
    private ifColumnResizeOn:GlobalBoolean;
    private ifColumnResizePointerDown:GlobalBoolean;
    
    
    constructor(rowsManager:RowsManager,tilesManager:TilesManager,columnsManager:ColumnsManager,ifRowResizeOn:GlobalBoolean,ifRowResizePointerDown:GlobalBoolean,ifColumnResizeOn:GlobalBoolean,ifColumnPointerDown:GlobalBoolean){
        this.rowsManager=rowsManager;
        this.tilesManager=tilesManager;
        this.columnsManager=columnsManager;
        this.ifRowResizeOn=ifRowResizeOn;
        this.ifRowResizePointerDown=ifRowResizePointerDown;
        this.ifColumnResizeOn=ifColumnResizeOn;
        this.ifColumnResizePointerDown=ifColumnPointerDown;
        
    }

    pointerUpEventHandler(event:Event){
        // console.log("pointer up called " );

        document.body.style.cursor="default";

        // for row
        const rowCanvasDivs=document.querySelectorAll(".subRow") as NodeListOf<HTMLDivElement>;
            rowCanvasDivs.forEach(rowCanvasDiv=>{
                const resizeDiv=rowCanvasDiv.lastElementChild as HTMLDivElement;
                resizeDiv.style.display="none";
            });

            if(this.ifRowResizePointerDown.value){
                this.tilesManager.redrawRow(this.rowsManager.currentResizingRowCanvas.rowID);
                this.ifRowResizePointerDown.value=false;
            }

            // for column
            const columnCanvasDivs=document.querySelectorAll(".subColumn") as NodeListOf<HTMLDivElement>;
            columnCanvasDivs.forEach(columnCanvasDiv=>{
                const resizeDiv=columnCanvasDiv.lastElementChild as HTMLDivElement;
                resizeDiv.style.display="none";
            });

            if(this.ifColumnResizePointerDown.value){
                console.log("before in column manager : ",[...this.columnsManager.visibleColumnsPrefixSum]);
                this.tilesManager.redrawColumn(this.columnsManager.currentResizingColumnCanvas.columnID);
                console.log("after in column manager : ",[...this.columnsManager.visibleColumnsPrefixSum]);
                // console.log("pointer up value reset");
                this.ifColumnResizePointerDown.value=false;
            }
    }



    pointerMove(event:PointerEvent){
        //row 
        if(this.ifRowResizeOn.value || this.ifRowResizePointerDown.value){
            document.body.style.cursor="ns-resize";
        }else if(this.ifColumnResizeOn.value || this.ifColumnResizePointerDown.value){
            document.body.style.cursor="ew-resize";
        }else{
            document.body.style.cursor="default";
        }

        if(this.ifRowResizePointerDown.value){
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
            
        }

        //column

        

        if(this.ifColumnResizePointerDown.value){
            console.log("pointer is down");
            this.columnsManager.currentResizingColumnCanvas.resizeColumn(event.clientX);
        }
        
    }
    
}