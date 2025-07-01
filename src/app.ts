import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { GlobalBoolean } from "./types/GlobalBoolean.js";
import { CellSelectionManager } from "./CellSelectionManager.js";
class App{
    private ifRowResizeOn:GlobalBoolean;
    private ifColumnResizeOn: GlobalBoolean;
    private ifRowResizePointerDown:GlobalBoolean;
    private ifColumnResizePointerDown:GlobalBoolean;
    private ifMultipleSelection:GlobalBoolean;
    
    constructor(){
        this.ifRowResizeOn={value:false};
        this.ifRowResizePointerDown={value:false};
        this.ifColumnResizeOn={value:false};
        this.ifColumnResizePointerDown={value:false};
        this.ifMultipleSelection={value:false};
        this.initialize();
    }

    private initialize(){
        const ScrollManagerObj = new ScrollManager();
        const RowsManagerObj = new RowsManager({[5]:{height:100},[30]:{height:200},[55]:{height:300}}, 0, ScrollManagerObj.verticalNum,this.ifRowResizeOn,this.ifRowResizePointerDown);
        const ColumnsManagerObj = new ColumnsManager({[5]:{width:200},[30]:{width:300},[55]:{width:400}}, 0, ScrollManagerObj.horizontalNum,this.ifColumnResizeOn,this.ifColumnResizePointerDown);
        const TilesManagerObj = new TilesManager(RowsManagerObj.rowsPositionPrefixSumArr, ColumnsManagerObj.visibleColumnsPrefixSum, ScrollManagerObj.verticalNum, ScrollManagerObj.horizontalNum,undefined,undefined,RowsManagerObj.marginTop,ColumnsManagerObj.marginLeft);
        ScrollManagerObj.initializeManager(ColumnsManagerObj, RowsManagerObj, TilesManagerObj);
        const ResizeManagerObj= new ResizeManager(RowsManagerObj,TilesManagerObj,ColumnsManagerObj,this.ifRowResizeOn,this.ifRowResizePointerDown,this.ifColumnResizeOn,this.ifColumnResizePointerDown);
        const CellSelectionManagerObj = new CellSelectionManager(RowsManagerObj,TilesManagerObj,ColumnsManagerObj,this.ifMultipleSelection);
        window.addEventListener("pointerup",(event)=>{
            console.log(event.target);
            ResizeManagerObj.pointerUpEventHandler(event);
        })

        window.addEventListener("pointermove",(event)=>{
            ResizeManagerObj.pointerMove(event);
        });
    }
}

new App();