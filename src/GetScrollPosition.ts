import { ColumnsManager } from "./ColumnsManager";
import { RowsManager } from "./RowsManager";


export class GetScrollPosition{
    private rowsManager:RowsManager;
    private columnsManager:ColumnsManager;
    
    constructor(rowsManager:RowsManager,columnsManager:ColumnsManager){
      this.rowsManager=rowsManager;
      this.columnsManager=columnsManager;
    }

    getIdxTop(scrollTop:number):{idx:number,top:number}{
        let sum=0;
        for(let i=1;i<=4000;i++){
            const currentSum=this.getSum25Row(i);
            if(sum+currentSum>scrollTop){
                return {idx:(i-1),top:sum};
            }
        }

        return {idx:4000,top:sum};
    }


    getIdxLeft(scrollLeft:number):{idx:number,left:number}{
        let sum=0;
        for(let i=1;i<=40;i++){
            const currentSum=this.getSum25Column(i);
            if(sum+currentSum>scrollLeft){
                return {idx:(i-1),left:sum};
            }
        }

        return {idx:40,left:sum};
    }



    private getSum25Row(idx:number){
        let currIdx=idx*25;
        let sum=0;
        for(let i=0;i<25;i++){
            currIdx++;
            const currentHeight= this.rowsManager.rowHeights.get(currIdx);
            if(currentHeight){
                sum+=currentHeight.height;
            }else{
                sum+=this.rowsManager.defaultHeight;
            }
        }

        return sum;
    }

    private getSum25Column(idx:number){
        let currIdx=idx*25;
        let sum=0;
        for(let i=0;i<25;i++){
            currIdx++;
            const currentWidth = this.columnsManager.columnWidths.get(currIdx);

            if(currentWidth){
                sum+=currentWidth.width;
            }else{
                sum+=this.columnsManager.defaultWidth;
            }
        }

        return sum;
    }
}

