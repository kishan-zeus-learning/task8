import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { columnData } from "./types/ColumnRows.js";
 
export class ColumnsManager{
    private columnWidths:columnData;
    private startColumnIdx:number;
    private visibleColumnCnt:number;
    readonly visibleColumns:ColumnsCanvas[];
    private marginLeft:number;
    private columnsDivContainer:HTMLDivElement;
    private defaultHeight:number;
    private defaultWidth:number;
 
    constructor(columnWidths:columnData,startColumnIdx:number,visibleColumnCnt:number,defaultHeight:number=25,defaultWidth:number=80,marginLeft:number=0){
        this.columnWidths=columnWidths;
        this.startColumnIdx=startColumnIdx;
        this.visibleColumnCnt=visibleColumnCnt;
        this.visibleColumns=[];
        this.marginLeft=marginLeft;
        this.defaultHeight=defaultHeight;
        this.defaultWidth=defaultWidth;
        this.columnsDivContainer=document.getElementById("columnsRow") as HTMLDivElement;
        this.initialLoad();
    }

    scrollRight(){
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
    }

    scrollLeft(){
        if(this.startColumnIdx===0) return ;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
    }

    private initialLoad(){
        for(let j=0;j<this.visibleColumnCnt;j++){
            const colIdx=j+this.startColumnIdx;
            this.visibleColumns.push(new ColumnsCanvas(colIdx,this.columnWidths,this.defaultWidth,this.defaultHeight));

            this.columnsDivContainer.appendChild(this.visibleColumns[j].columnCanvas);
        }
    }

    private mountColumnRight(){
        const colIdx=this.startColumnIdx+this.visibleColumnCnt-1;

        this.visibleColumns.push(new ColumnsCanvas(colIdx,this.columnWidths,this.defaultWidth,this.defaultHeight));

        this.columnsDivContainer.appendChild(this.visibleColumns[this.visibleColumns.length-1].columnCanvas);
    }

    private mountColumnLeft(){
        const columnIdx=this.startColumnIdx;

        this.visibleColumns.unshift(new ColumnsCanvas(columnIdx,this.columnWidths,this.defaultWidth,this.defaultHeight));
        this.columnsDivContainer.prepend(this.visibleColumns[0].columnCanvas);

        this.marginLeft-=this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft=`${this.marginLeft}px`;
    }

    private unmountColumnLeft(){
        this.marginLeft+=this.visibleColumns[0].columnsPositionArr[24];

        this.columnsDivContainer.style.marginLeft=`${this.marginLeft}px`;

        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvas);

        this.visibleColumns.shift();
    }

    private unmountColumnRight(){
        this.columnsDivContainer.removeChild(this.visibleColumns[this.visibleColumns.length-1].columnCanvas);
        this.visibleColumns.pop();
    }
 
}
 
