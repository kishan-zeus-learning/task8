import { ColumnsManager } from "./ColumnsManager.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";

export class ScrollManager{
    private gridDiv:HTMLDivElement;
    private sheetDiv:HTMLDivElement;
    private minHeight:number=18;
    private minWidth:number=40;
    private verticalNum:number;
    private horizontalNum:number;
    constructor(){
        this.gridDiv=document.getElementById("grid") as HTMLDivElement;
        this.sheetDiv=document.getElementById("sheet") as HTMLDivElement;
        this.verticalNum=this.minVerticalDiv()+2;
        this.horizontalNum=this.minHorizontalDiv()+2;
        console.log("total divs : ",this.verticalNum,this.horizontalNum);
        this.scrollListener();
    }

    private minVerticalDiv(){
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight/(this.minHeight))/25);
    }

    private minHorizontalDiv(){
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth/(this.minWidth))/25);
    }

    private scrollListener(){
        let lastScrollTop=this.sheetDiv.scrollTop;
        let lastScrollLeft=this.sheetDiv.scrollLeft;

        this.sheetDiv.addEventListener("scroll",(event)=>{
            const currentScrollTop=this.sheetDiv.scrollTop;
            const currentScrollLeft=this.sheetDiv.scrollLeft;
            if(currentScrollTop>lastScrollTop){
                this.handleScrollDown(event);
            }else if(currentScrollTop<lastScrollTop){
                this.handleScrollUp(event);
            }else if(currentScrollLeft>lastScrollLeft){
                this.handleScrollRight(event);
            }else{
                this.handleScrollLeft(event);
            }

            lastScrollLeft=currentScrollLeft;
            lastScrollTop=currentScrollTop;
        });
    }

    private handleScrollDown(event:Event){

    }

    private handleScrollUp(event:Event){

    }

    private handleScrollRight(event:Event){

    }
    private handleScrollLeft(event:Event){

    }
}

new ScrollManager();