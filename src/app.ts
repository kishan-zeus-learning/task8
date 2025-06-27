import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";

const obj = new ScrollManager();
const RowsManagerObj = new RowsManager({[5]:{height:100},[30]:{height:200},[55]:{height:300}}, 0, obj.verticalNum);
const ColumnsManagerObj = new ColumnsManager({[5]:{width:200},[30]:{width:300},[55]:{width:400}}, 0, obj.horizontalNum);
const TilesManagerObj = new TilesManager(RowsManagerObj.rowsPositionPrefixSumArr, ColumnsManagerObj.visibleColumnsPrefixSum, obj.verticalNum, obj.horizontalNum,undefined,undefined,RowsManagerObj.marginTop,ColumnsManagerObj.marginLeft);
obj.initializeManager(ColumnsManagerObj, RowsManagerObj, TilesManagerObj);
