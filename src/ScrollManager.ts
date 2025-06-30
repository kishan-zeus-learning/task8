import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";
 
export class ScrollManager {
    // private gridDiv: HTMLDivElement;
    private sheetDiv: HTMLDivElement;
    private minHeight: number = 18;
    private minWidth: number = 40;
    readonly verticalNum: number;
    readonly horizontalNum: number;
    private columnsManager: ColumnsManager | null = null;
    private rowsManager: RowsManager | null = null;
    private tilesManager: TilesManager | null = null;
    private containerDivRect:DOMRect;
 
    constructor() {
        // this.gridDiv = document.getElementById("grid") as HTMLDivElement;
        this.sheetDiv = document.getElementById("sheet") as HTMLDivElement;
        this.containerDivRect=this.sheetDiv.getBoundingClientRect();
        this.verticalNum = this.minVerticalDiv() + 2;
        this.horizontalNum = this.minHorizontalDiv() + 2;
        this.scrollListener();
    }
 
    initializeManager(columnsManager: ColumnsManager, rowsManager: RowsManager, tilesManager: TilesManager) {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }
 
    private minVerticalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / (this.minHeight)) / 25);
    }
 
    private minHorizontalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / (this.minWidth)) / 25);
    }
 
    private scrollListener() {
        let lastScrollTop = this.sheetDiv.scrollTop;
        let lastScrollLeft = this.sheetDiv.scrollLeft;
 
        this.sheetDiv.addEventListener("scroll", (event) => {
            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;
            if (currentScrollTop > lastScrollTop) {
                this.handleScrollDown(event);
            }
            if (currentScrollTop < lastScrollTop) {
                this.handleScrollUp(event);
            }
             if (currentScrollLeft > lastScrollLeft) {
                this.handleScrollRight(event);
            } 
            if(currentScrollLeft<lastScrollLeft) {
                this.handleScrollLeft(event);
            }
 
            lastScrollLeft = currentScrollLeft;
            lastScrollTop = currentScrollTop;
        });
 
    }
 
    private handleScrollDown(event: Event) {
        const lastRow = this.rowsManager?.visibleRows[this.rowsManager.visibleRows.length - 1] as RowsCanvas;
        const bufferRect = lastRow.rowCanvasDiv.getBoundingClientRect();
 
        const isVisible = (
bufferRect.top < this.containerDivRect.bottom &&
bufferRect.bottom > this.containerDivRect.top
        );
 
        if (isVisible) {
            if(this.rowsManager?.scrollDown()){
                this.tilesManager?.scrollDown();
            }
        }
    }
 
    private handleScrollUp(event: Event) {
        const firstRow = this.rowsManager?.visibleRows[0] as RowsCanvas;
 
        const bufferRect=firstRow.rowCanvasDiv.getBoundingClientRect();
 
        const isVisible=(
bufferRect.bottom>this.containerDivRect.top &&
bufferRect.top<this.containerDivRect.bottom
        );
 
        if(isVisible){
            if(this.rowsManager?.scrollUp()){
                this.tilesManager?.scrollUp();
            }
        }
    }
 
    private handleScrollRight(event: Event) {
        const lastColumn=this.columnsManager?.visibleColumns[this.columnsManager.visibleColumns.length-1] as ColumnsCanvas;
        const bufferRect=lastColumn.columnCanvas.getBoundingClientRect();
 
        const isVisible=(
            bufferRect.right>this.containerDivRect.left &&
            bufferRect.left<this.containerDivRect.right
        )
        if(isVisible){
            if(this.columnsManager?.scrollRight()){

                this.tilesManager?.scrollRight();

            }
        }
 
    }

    private handleScrollLeft(event: Event) {
        const firstColumn=this.columnsManager?.visibleColumns[0] as ColumnsCanvas;
        const bufferRect=firstColumn.columnCanvas.getBoundingClientRect();
 
        const isVisible=(
            bufferRect.left<this.containerDivRect.right &&
            bufferRect.right>this.containerDivRect.left
        )
 
        if(isVisible){
 
            if(this.columnsManager?.scrollLeft()){
                this.tilesManager?.scrollLeft();
            }
        }
 
    }
}
 


