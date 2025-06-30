import { GlobalBoolean } from "./types/GlobalBoolean";
import { GlobalNumber } from "./types/GlobalNumber";
import { RowData } from "./types/RowsColumn";
export class RowsCanvas {
    private rowHeights: RowData;
    public rowsPositionArr: number[];
    readonly rowID: number;
    readonly rowCanvasDiv: HTMLDivElement;
    public rowCanvas:HTMLCanvasElement|null=null;
    private defaultWidth: number;
    private defaultHeight: number;
    private resizeDiv:HTMLDivElement|null=null;
    private ifResizOn:{value:boolean};
    private currentResizingRow:GlobalNumber;
    private ifResizePointerDown:{value:boolean};
    private hoverIdx:number=-1;
    

    constructor(rowID: number, rowHeights: RowData, defaultWidth: number, defaultHeight: number,ifResizeOn:GlobalBoolean,ifResizePointerDown:GlobalBoolean,currentResizingRow:GlobalNumber) {
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = []
        this.currentResizingRow=currentResizingRow;
        // this.ifResizOn=ifResizeOn;
        this.ifResizOn=ifResizeOn;
        this.ifResizePointerDown=ifResizePointerDown;
        this.setRowsPositionArr();
        this.rowCanvasDiv = this.createRowCanvas();
        this.handleResize();
    }


    private handleResize(){

        this.rowCanvasDiv.addEventListener("pointerdown",(event)=>{
            this.ifResizePointerDown.value=true;
        });

        this.rowCanvasDiv.addEventListener("pointermove",(event)=>{

            if(this.ifResizePointerDown.value){
                
                this.currentResizingRow.value=this.rowID;
                
                return ;
            }
            this.hoverIdx=this.binarySearchRange(event.offsetY);
            if(this.hoverIdx!==-1){
                (this.ifResizOn as GlobalBoolean).value=true;
               
                if(this.resizeDiv)  {
                    this.resizeDiv.style.display="block";
                    this.resizeDiv.style.top=`${this.rowsPositionArr[this.hoverIdx]-0.5}px`;
                    this.resizeDiv.style.zIndex=`10`;
                }

            }else{

                if (!(this.ifResizePointerDown as GlobalBoolean).value){
                    if(this.resizeDiv) this.resizeDiv.style.display="none";        
                }
                this.ifResizOn.value=false;
            }
        });
        this.rowCanvasDiv.addEventListener("pointerout",(event)=>{
            if(!(this.ifResizePointerDown as GlobalBoolean).value){
                if(this.resizeDiv) this.resizeDiv.style.display="none";
            }
            (this.ifResizOn as GlobalBoolean).value=false;
        });
    }

    public resizeRow(newPosition:number){
        newPosition=newPosition-this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight;
        if(this.hoverIdx!==0){
            newHeight=newPosition-this.rowsPositionArr[this.hoverIdx-1];
        }else{
            newHeight=newPosition;
        }
        newHeight=Math.max(25,newHeight);
        newHeight=Math.min(500,newHeight);
        if(this.hoverIdx!==0){
            (this.resizeDiv as HTMLDivElement).style.top=`${this.rowsPositionArr[this.hoverIdx-1] + newHeight}px`;
        }else{
            (this.resizeDiv as HTMLDivElement).style.top=`${newHeight}px`;
        }
        if(newHeight===25) delete this.rowHeights[this.rowID*25 + this.hoverIdx +1];
        else this.rowHeights[this.rowID*25 + this.hoverIdx + 1]={height:newHeight};

        this.setRowsPositionArr();
        this.drawCanvas();
    }



    private binarySearchRange(num:number){
        let start=0;
        let end=24;
        let mid;
        while(start<=end){
            mid=Math.floor((start+end)/2);

            if(this.rowsPositionArr[mid]+5>=num && num>=this.rowsPositionArr[mid]-5){
                return mid;
            }else if(num>this.rowsPositionArr[mid]){
                start=mid+1;
            }else{
                end=mid-1;
            }
        }
        return -1;
    }

    private setRowsPositionArr() {
        let startNum = this.rowID * 25 + 1;
        let prefixSum = 0;


        this.rowsPositionArr.length=0;
        for (let i = 0; i < 25; i++) {
            if (this.rowHeights[i + startNum]) {
                prefixSum += this.rowHeights[i + startNum].height;
            } else {
                prefixSum += this.defaultHeight;
            }
            this.rowsPositionArr.push(prefixSum);
        }

    }

    private createRowCanvas() {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`;
        rowDiv.classList.add("subRow");

        this.rowCanvas = document.createElement("canvas");

        this.drawCanvas();
        rowDiv.appendChild(this.rowCanvas);
        this.resizeDiv=document.createElement("div");
        this.resizeDiv.classList.add("RowResizeDiv");
        
        rowDiv.appendChild(this.resizeDiv);
        return rowDiv;
    }

    drawCanvas(){
        if(!this.rowCanvas) return ;
        
        const dpr = window.devicePixelRatio || 1;
        this.rowCanvas.width = this.defaultWidth * dpr;
        this.rowCanvas.height = this.rowsPositionArr[24] * dpr;
        this.rowCanvas.style.width = `${this.defaultWidth}px`;
        this.rowCanvas.style.height = `${this.rowsPositionArr[24]}px`;


        const ctx = this.rowCanvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.clearRect(0,0,this.defaultWidth,this.rowsPositionArr[24]);
        ctx.scale(dpr, dpr);
        ctx.beginPath();
        ctx.fillStyle = "#e7e7e7";
        ctx.fillRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]);

        ctx.font = '16px Arial';
        ctx.lineWidth = 1;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";


        let startNum = this.rowID * 25 + 1;
        const offset = 0.5 / dpr;
        for (let i = 0; i < 25; i++) {
            ctx.moveTo(0, this.rowsPositionArr[i] - offset);
            ctx.lineTo(this.defaultWidth, this.rowsPositionArr[i] - offset);

            const yPos = Math.round(this.rowsPositionArr[i] - (this.rowsPositionArr[i] - ((i === 0) ? 0 : this.rowsPositionArr[i - 1])) / 2 + 1);
            ctx.fillText(`${i + startNum}`, this.defaultWidth - 5, yPos);
        }

        ctx.moveTo(this.defaultWidth - 0.5, 0);
        ctx.lineTo(this.defaultWidth - 0.5, this.rowsPositionArr[24]);
        ctx.moveTo(0.5, 0);
        ctx.lineTo(0.5, this.rowsPositionArr[24]);
        ctx.stroke();


    }

}

