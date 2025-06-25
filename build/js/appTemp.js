import { RowsCanvas } from './Rows.js';
import { ColumnsCanvas } from './Columns.js';
// import { Tile } from './Tile.js';
import { TilesManager } from './TilesManager.js';
const obj = new RowsCanvas(0, { [20]: { height: 500 } }, 80, 24);
const div = obj.createRowCanvas(0);
const obj2 = new RowsCanvas(1, {}, 80, 24);
const div2 = obj2.createRowCanvas(1);
const obj3 = new RowsCanvas(2, {}, 80, 24);
const div3 = obj3.createRowCanvas(2);
const temp = document.querySelector('.rowsColumn');
temp === null || temp === void 0 ? void 0 : temp.appendChild(div);
temp === null || temp === void 0 ? void 0 : temp.appendChild(div2);
temp === null || temp === void 0 ? void 0 : temp.appendChild(div3);
const colObj = new ColumnsCanvas(0, { [3]: { width: 160 }, [20]: {
        width: 900
    } }, 80, 25);
const colObj2 = new ColumnsCanvas(1, {}, 80, 25);
const temp2 = document.querySelector('.columnsRow');
temp2 === null || temp2 === void 0 ? void 0 : temp2.appendChild(colObj.createcolumnCanvas());
temp2 === null || temp2 === void 0 ? void 0 : temp2.appendChild(colObj2.createcolumnCanvas());
const rowsPositionArr = [obj.rowsPositionArr, obj2.rowsPositionArr];
const columnsPositionArr = [colObj.columnsPositionArr, colObj2.columnsPositionArr];
const tilesManagerObj = new TilesManager(rowsPositionArr, columnsPositionArr, 2, 2, 0, 0);
tilesManagerObj.mountTileBottom();
