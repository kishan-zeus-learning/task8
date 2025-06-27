// import { RowsCanvas } from "./RowsCanvas";
import { ColumnsManager } from "./ColumnsManager";
import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";

export class ResizeManager{
    private rowsManager:RowsManager;
    private tilesManager:TilesManager;
    private columnsManager:ColumnsManager;
    
    constructor(rowsManager:RowsManager,tilesManager:TilesManager,columnsManager:ColumnsManager){
        this.rowsManager=rowsManager;
        this.tilesManager=tilesManager;
        this.columnsManager=columnsManager;
        this.handleRowsResize();
    }

    private handleRowsResize(){
        this.rowsManager.visibleRows.forEach((visibleRow)=>{
            visibleRow.rowCanvasDiv.addEventListener("mousemove",(event)=>{
                console.log(`Hello from div id : ${visibleRow.rowID}`);
            })
        })
    }
}