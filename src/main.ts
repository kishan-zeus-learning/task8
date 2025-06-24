interface RowData{
    [row:number]:{
        height:number;
    }
}

class Rows{
    private rowHeights:RowData;
    private mountBackPos:number;
    private mountFrontPos:number;

    constructor(rowHeights:RowData,mountBackPos:number,mountFrontPos:number){
        this.rowHeights=rowHeights;
        this.mountBackPos=mountBackPos;
        this.mountFrontPos=mountFrontPos;
    }

    


}

export class RowsCanvas{
    private rowHeights:RowData;
    readonly rowsPositionArr:number[];
    readonly rowID:number;
    private rowCanvas:HTMLDivElement;
    private defaultWidth:number;
    private defaultHeight:number;

    constructor(rowID:number,rowHeights:RowData,defaultWidth:number,defaultHeight:number){
        this.rowHeights=rowHeights;
        this.rowID=rowID;
        this.defaultHeight=defaultHeight;
        this.defaultWidth=defaultWidth;
        this.rowsPositionArr=this.getRowsPositionArr(this.rowID);
        this.rowCanvas=this.createRowCanvas(this.rowID);
        // console.log("default height: ",this.defaultHeight);
        
    }

    getRowsPositionArr(rowID:number){
        let startNum=rowID*25+1;
        let prefixSum=0;
        const rowsPosition=[];
        for(let i=0;i<25;i++){
            if(this.rowHeights[i+startNum]){
                prefixSum+=this.rowHeights[i+startNum].height;
            }else{
                prefixSum+=this.defaultHeight;
                // console.log(`${i} executed in else`);
                // console.log(prefixSum);
            }
            // // console.log(prefixSum);
            rowsPosition.push(prefixSum);
        }

        // // console.log(rowsPosition);

        return rowsPosition;
    }

    createRowCanvas(rowID:number){
        const rowDiv=document.createElement("div");
        rowDiv.id=`row${rowID}`;
        rowDiv.classList.add("subRow");
        const rowCanvas=document.createElement("canvas");
        rowCanvas.width=this.defaultWidth;
        rowCanvas.height=this.rowsPositionArr[24];
        rowDiv.style.height=`${this.rowsPositionArr[24]}px`;
        // console.log(this.rowsPositionArr);

        const ctx=rowCanvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.beginPath();
        ctx.fillStyle="#e7e7e7";
        ctx.font = '12px Arial';
        ctx.lineWidth=1;
        ctx.textAlign="right";
        ctx.textBaseline="middle";
        ctx.fillRect(0,0,this.defaultWidth,this.rowsPositionArr[24]);
        let startNum=rowID*25+1;
        for(let i=0;i<25;i++){
            ctx.fillStyle="black";
            ctx.moveTo(0,this.rowsPositionArr[i]);
            ctx.lineTo(this.defaultWidth,this.rowsPositionArr[i]);
            ctx.stroke();
            ctx.fillText(`${i+startNum}`,(this.defaultWidth-5),(this.rowsPositionArr[i]-(this.rowsPositionArr[i]-((i===0)?0:this.rowsPositionArr[i-1]))/2+1));
        }

        rowDiv.appendChild(rowCanvas);
        console.log(this.rowHeights);
        return rowDiv;
    }
}

// const obj=new RowsCanvas(0,{[20]:{height:500}},80,24);
// const div=obj.createRowCanvas(0);

// const obj2=new RowsCanvas(1,{},80,24);
// const div2=obj.createRowCanvas(1);

// const obj3=new RowsCanvas(2,{},80,24);
// const div3=obj.createRowCanvas(2);

// const temp=document.querySelector('.rowsColumn');

// temp?.appendChild(div);
// temp?.appendChild(div2);
// temp?.appendChild(div3);
