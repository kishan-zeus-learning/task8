import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { GlobalBoolean } from "./types/GlobalBoolean.js";
class App{
    private ifResizeOn:GlobalBoolean;
    private ifResizePointerDown:GlobalBoolean;
    
    constructor(){
        this.ifResizeOn={value:false};
        this.ifResizePointerDown={value:false};
        this.initialize();
    }

    private initialize(){
        const ScrollManagerObj = new ScrollManager();
        const RowsManagerObj = new RowsManager({[5]:{height:100},[30]:{height:200},[55]:{height:300}}, 0, ScrollManagerObj.verticalNum,this.ifResizeOn,this.ifResizePointerDown);
        const ColumnsManagerObj = new ColumnsManager({[5]:{width:200},[30]:{width:300},[55]:{width:400}}, 0, ScrollManagerObj.horizontalNum);
        const TilesManagerObj = new TilesManager(RowsManagerObj.rowsPositionPrefixSumArr, ColumnsManagerObj.visibleColumnsPrefixSum, ScrollManagerObj.verticalNum, ScrollManagerObj.horizontalNum,undefined,undefined,RowsManagerObj.marginTop,ColumnsManagerObj.marginLeft);
        ScrollManagerObj.initializeManager(ColumnsManagerObj, RowsManagerObj, TilesManagerObj);
        const ResizeManagerObj= new ResizeManager(RowsManagerObj,TilesManagerObj,ColumnsManagerObj,this.ifResizeOn,this.ifResizePointerDown);

        window.addEventListener("pointerup",(event)=>{
            // console.log("pointer up window");
            ResizeManagerObj.pointerUpEventHandler(event);
        })

        window.addEventListener("pointermove",(event)=>{
            // console.log("pointer move window : ");
            ResizeManagerObj.pointerMove(event);
        })
    }
}

new App();