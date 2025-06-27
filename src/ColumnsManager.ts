import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { columnData } from "./types/ColumnRows.js";
export class ColumnsManager{
    private columnWidths:columnData;
    private startColumnIdx:number;
    private visibleColumnCnt:number;
    readonly visibleColumns:ColumnsCanvas[];
    readonly visibleColumnsPrefixSum:number[][];
    readonly marginLeft:{value:number};
    private columnsDivContainer:HTMLDivElement;
    private defaultHeight:number;
    private defaultWidth:number;
    private columnCanvasLimit:number;
    constructor(columnWidths:columnData,startColumnIdx:number,visibleColumnCnt:number,columnCanvasLimit:number=40,defaultHeight:number=25,defaultWidth:number=80,marginLeft:{value:number}={value:0}){
        this.columnWidths=columnWidths;
        this.startColumnIdx=startColumnIdx;
        this.columnCanvasLimit=columnCanvasLimit;
        this.visibleColumnCnt=visibleColumnCnt;
        this.visibleColumns=[];
        this.visibleColumnsPrefixSum=[];
        this.marginLeft=marginLeft;
        this.defaultHeight=defaultHeight;
        this.defaultWidth=defaultWidth;
        this.columnsDivContainer=document.getElementById("columnsRow") as HTMLDivElement;
        this.initialLoad();
    }
 
    scrollRight(){
        if(this.startColumnIdx===(this.columnCanvasLimit-1-this.visibleColumnCnt)) return false;
        
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }
 
    scrollLeft(){
        if(this.startColumnIdx===0) return false;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }
 
    private initialLoad(){
        for(let j=0;j<this.visibleColumnCnt;j++){
            const colIdx=j+this.startColumnIdx;
            this.visibleColumns.push(new ColumnsCanvas(colIdx,this.columnWidths,this.defaultWidth,this.defaultHeight));
            this.visibleColumnsPrefixSum.push(this.visibleColumns[j].columnsPositionArr);
            this.columnsDivContainer.appendChild(this.visibleColumns[j].columnCanvas);
        }
    }
 
    private mountColumnRight(){
        const colIdx=this.startColumnIdx+this.visibleColumnCnt-1;
 
        this.visibleColumns.push(new ColumnsCanvas(colIdx,this.columnWidths,this.defaultWidth,this.defaultHeight));
 
        this.columnsDivContainer.appendChild(this.visibleColumns[this.visibleColumns.length-1].columnCanvas);
        this.visibleColumnsPrefixSum.push(this.visibleColumns[this.visibleColumns.length-1].columnsPositionArr);
    }
 
    private mountColumnLeft(){
        const columnIdx=this.startColumnIdx;
 
        this.visibleColumns.unshift(new ColumnsCanvas(columnIdx,this.columnWidths,this.defaultWidth,this.defaultHeight));
        this.columnsDivContainer.prepend(this.visibleColumns[0].columnCanvas);
        this.visibleColumnsPrefixSum.unshift(this.visibleColumns[0].columnsPositionArr);
        this.marginLeft.value-=this.visibleColumns[0].columnsPositionArr[24];
this.columnsDivContainer.style.marginLeft=`${this.marginLeft.value}px`;
    }
 
    private unmountColumnLeft(){
        this.marginLeft.value+=this.visibleColumns[0].columnsPositionArr[24];
 
this.columnsDivContainer.style.marginLeft=`${this.marginLeft.value}px`;
 
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvas);
        
        this.visibleColumns.shift();
        this.visibleColumnsPrefixSum.shift();
    }
 
    private unmountColumnRight(){
        this.columnsDivContainer.removeChild(this.visibleColumns[this.visibleColumns.length-1].columnCanvas);
        this.visibleColumns.pop();
        this.visibleColumnsPrefixSum.pop();
    }
}