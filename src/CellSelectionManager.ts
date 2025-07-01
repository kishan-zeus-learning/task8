// import { Cells } from "./types/Cells";
import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";
import { ColumnsManager } from "./ColumnsManager";
import { GlobalBoolean } from "./types/GlobalBoolean";

export class CellSelectionManager{
    selectedCells: object;
    private selectedRows: number[];
    private selectedColumns: number[];
    /** @type {RowsManager} Manages row operations and resizing */
        private rowsManager: RowsManager;
    
        /** @type {TilesManager} Manages tile operations and updates */
        private tilesManager: TilesManager;
    
        /** @type {ColumnsManager} Manages column operations and resizing */
        private columnsManager: ColumnsManager;

        private ifMultipleSelection:GlobalBoolean;
    constructor(rowsManager:RowsManager,tilesManager:TilesManager,columnsManager:ColumnsManager,ifMultipleSelection:GlobalBoolean){
        this.selectedCells={};
        this.selectedRows=[];
        this.selectedColumns=[];
        this.ifMultipleSelection=ifMultipleSelection;
        this.rowsManager=rowsManager;
        this.columnsManager=columnsManager;
        this.tilesManager=tilesManager;

        this.init();
    }

    selectCell(row:number,col:number){
        // this.selectedCells.push({row,col});
    }

    deselectCell(row:number,col:number){
        
    }

    private init(){

        this.tilesManager.gridDiv.addEventListener("click",(event)=>{
            // console.log(event.offsetX,event.offsetY);
            console.log(this.getRowColumn(event));

        })
    }

    private getRowColumn(event: MouseEvent) {
    
    const canvasUnderCursor = document.elementFromPoint(event.clientX, event.clientY) as HTMLCanvasElement;

    if (!canvasUnderCursor || canvasUnderCursor.tagName !== 'CANVAS') {
        return null;
    }

    const canvasElementRect = canvasUnderCursor.getBoundingClientRect();
    const offsetX = event.clientX - canvasElementRect.left;
    const offsetY = event.clientY - canvasElementRect.top;

    const currentRow = parseInt(canvasUnderCursor.getAttribute('row') as string);
    const currentCol = parseInt(canvasUnderCursor.getAttribute('col') as string);

    const arrRowIdx = currentRow - this.tilesManager.visibleTiles[0][0].row;
    const arrColIdx = currentCol - this.tilesManager.visibleTiles[0][0].col;

    const tile = this.tilesManager.visibleTiles[arrRowIdx][arrColIdx];

    const row = currentRow * 25 + this.binarySearchUpperBound(tile.rowsPositionArr, offsetY) + 1;
    const col = currentCol * 25 + this.binarySearchUpperBound(tile.colsPositionArr, offsetX) + 1;

    return { row, col };
}


    selectCellPointerMove(event:PointerEvent){

    }

    private binarySearchUpperBound(arr:number[],target:number){
        let start=0;
        let end=24;
        let mid;
        let ans=-1;
        while(start<=end){
            mid=Math.floor((start+end)/2);

            if(target<=arr[mid]){
                ans=mid;
                end=mid-1;
            }else{
                start=mid+1;
            }
        }

        return ans;

    }
}