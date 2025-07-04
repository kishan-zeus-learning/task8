import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";
import { ColumnsManager } from "./ColumnsManager";
import { GlobalBoolean } from "./types/GlobalBoolean";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";

export class CellSelectionManager {
    coordinateX = 0;
    coordinateY = 0;
    scrollId:number | null=null;
    // selectedCells: object;
    ifTileSelectionOn: GlobalBoolean;
    ifRowSelectionOn: GlobalBoolean;
    ifColumnSelectionOn: GlobalBoolean;
    readonly maxDistance:number=100;
    readonly maxSpeed:number=10;
    selectionCoordinates: MultipleSelectionCoordinates;
    // private selectedRows: number[];
    // private selectedColumns: number[];
    /** @type {RowsManager} Manages row operations and resizing */
    private rowsManager: RowsManager;

    /** @type {TilesManager} Manages tile operations and updates */
    private tilesManager: TilesManager;

    /** @type {ColumnsManager} Manages column operations and resizing */
    private columnsManager: ColumnsManager;

    // private ifMultipleSelection: GlobalBoolean;

    private sheetDiv = document.getElementById('sheet') as HTMLDivElement;
    constructor(rowsManager: RowsManager, tilesManager: TilesManager, columnsManager: ColumnsManager, ifTilesSelectionOn: GlobalBoolean,ifRowsSelectionOn:GlobalBoolean,ifColumnSelectionOn:GlobalBoolean,selectionCoordinates:MultipleSelectionCoordinates) {
        // this.selectedCells = {};
        // this.selectedRows = [];
        // this.selectedColumns = [];
        this.ifTileSelectionOn = ifTilesSelectionOn;
        this.ifRowSelectionOn=ifRowsSelectionOn;
        this.ifColumnSelectionOn=ifColumnSelectionOn;
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;

        this.selectionCoordinates = selectionCoordinates;
        this.autoScroll=this.autoScroll.bind(this);
        this.init();
    }


    private init() {

        this.tilesManager.gridDiv.addEventListener("pointerdown", (event) => this.tilePointerDown(event));

        this.rowsManager.rowsDivContainer.addEventListener("pointerdown",(event)=> this.rowPointerDown(event));

        this.columnsManager.columnsDivContainer.addEventListener("pointerdown",(event)=>this.columnPointerDown(event));
    }

    private columnPointerDown(event:PointerEvent){
        if(this.ifColumnResize(event)) return ;
        let startColumn=this.getColumn(event.target as HTMLElement,event.clientX,event.clientY);

        if(!startColumn) return console.log("not canvas element in column pointer down");

        this.selectionCoordinates.selectionStartRow=1;
        this.selectionCoordinates.selectionEndRow=1000000;
        this.selectionCoordinates.selectionStartColumn=startColumn;
        this.selectionCoordinates.selectionEndColumn=startColumn;
        this.ifColumnSelectionOn.value=true;

        this.coordinateX=event.clientX;
        this.coordinateY=event.clientY;

        this.rerender();
        this.startAutoScroll();
    }

    private rowPointerDown(event:PointerEvent){
        if(this.ifRowResize(event)) return;
        let startRow=this.getRow(event.target as HTMLElement,event.clientX,event.clientY);

        if(!startRow) return console.log("not canvas element in row pointer down");

        this.selectionCoordinates.selectionStartRow=startRow;
        this.selectionCoordinates.selectionEndRow=startRow;
        this.selectionCoordinates.selectionStartColumn=1;
        this.selectionCoordinates.selectionEndColumn=1000;
        this.ifRowSelectionOn.value=true;

        this.coordinateX=event.clientX;
        this.coordinateY=event.clientY;

        this.rerender();
        this.startAutoScroll();

    }


    private getColumn(canvasUnderCursor:HTMLElement,clientX:number,clientY:number){
        if(!canvasUnderCursor || canvasUnderCursor.tagName!=="CANVAS") return null;

        const canvasElementRect = canvasUnderCursor.getBoundingClientRect();

        const offsetX = clientX - canvasElementRect.left;

        const currentColumn = parseInt(canvasUnderCursor.getAttribute('col') as string);

        const arrColumnIdx=currentColumn - this.columnsManager.visibleColumns[0].columnID;

        const columnElement = this.columnsManager.visibleColumns[arrColumnIdx];

        const column= currentColumn*25 + this.binarySearchUpperBound(columnElement.columnsPositionArr,offsetX)+1;
        return column;
    }

    private getRow(canvasUnderCursor:HTMLElement,clientX:number,clientY:number){
        if(!canvasUnderCursor || canvasUnderCursor.tagName!=="CANVAS") return null;

        const canvasElementRect=canvasUnderCursor.getBoundingClientRect();

        // const offsetX=clientX - canvasElementRect.left;
        const offsetY=clientY - canvasElementRect.top;

        const currentRow= parseInt(canvasUnderCursor.getAttribute('row') as string);

        const arrRowIdx = currentRow - this.rowsManager.visibleRows[0].rowID;

        const rowElement=this.rowsManager.visibleRows[arrRowIdx];

        const row= currentRow*25 + this.binarySearchUpperBound(rowElement.rowsPositionArr,offsetY) + 1;

        return row;

    }

    private getTileRowColumn(canvasUnderCursor:HTMLElement,clientX:number,clientY:number) {

        if (!canvasUnderCursor || canvasUnderCursor.tagName !== 'CANVAS') {
            return null;
        }

        const canvasElementRect = canvasUnderCursor.getBoundingClientRect();
        const offsetX = clientX - canvasElementRect.left;
        const offsetY = clientY - canvasElementRect.top;

        const currentRow = parseInt(canvasUnderCursor.getAttribute('row') as string);
        const currentCol = parseInt(canvasUnderCursor.getAttribute('col') as string);

        const arrRowIdx = currentRow - this.tilesManager.visibleTiles[0][0].row;
        const arrColIdx = currentCol - this.tilesManager.visibleTiles[0][0].col;

        const tile = this.tilesManager.visibleTiles[arrRowIdx][arrColIdx];

        const row = currentRow * 25 + this.binarySearchUpperBound(tile.rowsPositionArr, offsetY) + 1;
        const col = currentCol * 25 + this.binarySearchUpperBound(tile.colsPositionArr, offsetX) + 1;

        return { row, col };
    }

    private calculateSpeed(distance:number){
        return Math.min(distance/this.maxDistance,1)*this.maxSpeed;
    }

    private startAutoScroll(){
        if(this.scrollId!==null) return;
        this.scrollId=requestAnimationFrame(this.autoScroll);

    }

    private autoScroll(){
        if(!this.ifTileSelectionOn.value && !this.ifRowSelectionOn.value && !this.ifColumnSelectionOn.value){
            this.scrollId=null;
            return;
        }

        const rect=this.sheetDiv.getBoundingClientRect();

        let dx=0, dy=0;

        if(this.coordinateY > rect.bottom -30){
            dy=this.calculateSpeed(this.coordinateY - rect.bottom + 30);
        }else if(this.coordinateY<rect.top){
            dy=-this.calculateSpeed(rect.top-this.coordinateY);
        }

        if(this.coordinateX>rect.right-30){
            dx= this.calculateSpeed(this.coordinateX - rect.right + 30);
        }else if(this.coordinateX<rect.left){
            dx=-this.calculateSpeed(rect.left - this.coordinateX);
        }
        


        this.sheetDiv.scrollBy(dx,dy);

        if(this.ifTileSelectionOn.value){

            const canvasX=Math.min(rect.right-18,Math.max(this.coordinateX,rect.left+1+this.rowsManager.defaultWidth));
    
            const canvasY=Math.min(rect.bottom-18,Math.max(this.coordinateY,this.columnsManager.defaultHeight+1+rect.top));
    
            let rowColObj=this.getTileRowColumn(document.elementFromPoint(canvasX,canvasY) as HTMLElement,canvasX,canvasY);
    
            if(rowColObj){
                this.selectionCoordinates.selectionEndRow=rowColObj.row;
                this.selectionCoordinates.selectionEndColumn=rowColObj.col;
            }
        }


        if(this.ifRowSelectionOn.value){
            const canvasX = this.rowsManager.defaultWidth/2;
            const canvasY=Math.min(rect.bottom - 18,Math.max(this.coordinateY,this.columnsManager.defaultHeight+1+rect.top));

            const endRow=this.getRow(document.elementFromPoint(canvasX,canvasY) as HTMLElement,canvasX,canvasY);
            if(endRow) this.selectionCoordinates.selectionEndRow=endRow;
        }

        if(this.ifColumnSelectionOn.value){
            const canvasX=Math.min(rect.right-18,Math.max(this.coordinateX,rect.left+1+this.rowsManager.defaultWidth));
            const canvasY= 216+this.columnsManager.defaultHeight/2;
            const endColumn=this.getColumn(document.elementFromPoint(canvasX,canvasY) as HTMLElement,canvasX,canvasY);
            if(endColumn) this.selectionCoordinates.selectionEndColumn=endColumn;
        }


        this.rerender();

        this.scrollId=requestAnimationFrame(this.autoScroll);

    }

    pointerMove(event: PointerEvent) {
        if (!this.ifTileSelectionOn.value && !this.ifRowSelectionOn.value && !this.ifColumnSelectionOn.value) return;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

    }

    tilePointerDown(event: PointerEvent) {
        
        
        let startRowCol = this.getTileRowColumn(event.target as HTMLElement,event.clientX,event.clientY);
        if (!startRowCol) return console.log("not canvas element in tile pointer down");

        this.selectionCoordinates.selectionStartRow = startRowCol.row;
        this.selectionCoordinates.selectionStartColumn = startRowCol.col;
        this.selectionCoordinates.selectionEndRow=startRowCol.row;
        this.selectionCoordinates.selectionEndColumn=startRowCol.col;
        this.ifTileSelectionOn.value = true;
        this.coordinateY = event.clientY;
        this.coordinateX = event.clientX;
        // document.body.style.cursor="cell";
        this.rerender();
        this.startAutoScroll();

    }

    pointerUp(event: PointerEvent) {
        this.ifTileSelectionOn.value = false;
        this.ifRowSelectionOn.value=false;
        this.ifColumnSelectionOn.value=false;
        console.log("selection coordinates : ",this.selectionCoordinates);
    }

    private rerender(){
        this.tilesManager.rerender();
        this.rowsManager.rerender();
        this.columnsManager.rerender();
    }

    private binarySearchUpperBound(arr: number[], target: number) {
        let start = 0;
        let end = 24;
        let mid;
        let ans = -1;
        while (start <= end) {
            mid = Math.floor((start + end) / 2);

            if (target <= arr[mid]) {
                ans = mid;
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }

        return ans;

    }

    private ifRowResize(event:PointerEvent){
        const canvas=(event.target as HTMLCanvasElement);
        const canvasRect = canvas.getBoundingClientRect();
        const offsetY=event.clientY - canvasRect.top;
        const rowID=parseInt(canvas.getAttribute('row') as string);
        const arrIdx=rowID - this.rowsManager.visibleRows[0].rowID;
        return this.binarySearchRange(this.rowsManager.visibleRows[arrIdx].rowsPositionArr,offsetY)!==-1;
    }

    private ifColumnResize(event:PointerEvent){
        const canvas = event.target as HTMLCanvasElement;
        const canvasRect = canvas.getBoundingClientRect();
        const offsetX = event.clientX - canvasRect.left;
        const columnID = parseInt(canvas.getAttribute('col') as string);
        const arrIdx=columnID - this.columnsManager.visibleColumns[0].columnID;

        return this.binarySearchRange(this.columnsManager.visibleColumns[arrIdx].columnsPositionArr,offsetX)!==-1;
    }

    private binarySearchRange(arr:number[],target:number){
        let start=0;
        let end=24;
        let mid;

        while(start<=end){
            mid=Math.floor((start+end)/2);

            if(Math.abs(arr[mid] - target)<=5) return mid;
            else if(arr[mid]>target) end=mid-1;
            else start=mid+1;
        }
        return -1;
    }
}