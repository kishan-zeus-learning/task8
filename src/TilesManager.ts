import { Tile } from "./Tile.js";
type visibleTilesType= Tile[][];


export class TilesManager{
    private visibleTiles:visibleTilesType;
    private visibleTilesRowDiv:HTMLDivElement[];
    private visibleTilesRowPrefixSum:number[][];
    private visibleTilesColumnPrefixSum:number[][];
    private visibleRowCnt:number;
    private visibleColumnCnt:number;
    private startRowIdx:number;
    private endRowIdx:number;
    private startColIdx:number;
    private endColIdx:number;
    private marginTop:number;
    private gridDiv:HTMLDivElement;


    constructor(visibleTilesRowPrefixSum:number[][],visibleTilesColumnPrefixSum:number[][],visibleRowCnt:number,visibleColumnCnt:number,startRowIdx:number=0,startColIdx:number=0,marginTop:number=0){
        this.gridDiv=document.getElementById("grid") as HTMLDivElement;
        this.visibleTilesRowPrefixSum=visibleTilesRowPrefixSum;
        this.visibleTilesColumnPrefixSum=visibleTilesColumnPrefixSum;
        this.visibleTiles=[];
        this.visibleTilesRowDiv=[];
        this.visibleRowCnt=visibleRowCnt;
        this.visibleColumnCnt=visibleColumnCnt;
        this.startRowIdx=startRowIdx;
        this.endRowIdx=startRowIdx+visibleRowCnt-1;
        this.startColIdx=startColIdx;
        this.endColIdx=startColIdx+visibleColumnCnt-1;
        this.marginTop=marginTop;
        this.initialLoad();

    }

    private initialLoad(){
        for(let i=this.startRowIdx;i<this.visibleRowCnt+this.startRowIdx;i++){
            this.visibleTilesRowDiv.push(this.createRowDiv(i));
            const currentVisibleRow:Tile[]=[];
            for(let j=this.startColIdx;j<this.visibleColumnCnt+this.startColIdx;j++){
                const tile=new Tile(i,j,this.visibleTilesRowPrefixSum[i-this.startRowIdx],this.visibleTilesColumnPrefixSum[j-this.startColIdx]);
                currentVisibleRow.push(tile);
                this.visibleTilesRowDiv[i-this.startRowIdx].appendChild(tile.tileDiv);
            }
            this.visibleTiles.push(currentVisibleRow);
            this.gridDiv.appendChild(this.visibleTilesRowDiv[i]);
        }

    }

    createRowDiv(rowID:number){
        const tilesDiv=document.createElement("div");
        tilesDiv.id=`tileRow${rowID}`;
        tilesDiv.classList.add("flex");

        return tilesDiv;
    }


    mountTileBottom(){
        const rowIdx=this.startRowIdx+this.visibleRowCnt;
        console.log(rowIdx);
        this.visibleTilesRowDiv.push(this.createRowDiv(rowIdx));
        const currentVisibleRow:Tile[]=[];
            for(let j=this.startColIdx;j<this.visibleColumnCnt+this.startColIdx;j++){
                const tile=new Tile(rowIdx,j,this.visibleTilesRowPrefixSum[this.visibleRowCnt-1],this.visibleTilesColumnPrefixSum[j]);
                currentVisibleRow.push(tile);

                this.visibleTilesRowDiv[this.visibleTilesRowDiv.length-1].appendChild(tile.tileDiv);

            }
            this.visibleTiles.push(currentVisibleRow);
            console.log(this.visibleTilesRowDiv[this.visibleTilesRowDiv.length-1]);
            this.gridDiv.appendChild(this.visibleTilesRowDiv[this.visibleTilesRowDiv.length-1]);

    }
    

    mountTileTop(){

    }

    mountTileLeft(){

    }

    mountTileRight(){
        
    }



}
