import { RowsCanvas } from './RowsCanvas.js';
import { ColumnsCanvas } from './ColumnsCanvas.js';
import { Tile } from './Tile.js';
const obj = new RowsCanvas(0, { [20]: { height: 500 } }, 80, 24);
const div = obj.rowCanvas;
const obj2 = new RowsCanvas(1, {}, 80, 24);
const div2 = obj2.rowCanvas;
const obj3 = new RowsCanvas(2, {}, 80, 24);
const div3 = obj3.rowCanvas;
const temp = document.querySelector('.rowsColumn');
temp === null || temp === void 0 ? void 0 : temp.appendChild(div);
temp === null || temp === void 0 ? void 0 : temp.appendChild(div2);
temp === null || temp === void 0 ? void 0 : temp.appendChild(div3);
const colObj = new ColumnsCanvas(0, { [3]: { width: 160 }, [20]: {
        width: 900
    } }, 80, 25);
const temp2 = document.querySelector('.columnsRow');
temp2 === null || temp2 === void 0 ? void 0 : temp2.appendChild(colObj.columnCanvas);
const temp3 = document.getElementById("grid");
const tileObj = new Tile(0, 0, obj.rowsPositionArr, colObj.columnsPositionArr);
temp3 === null || temp3 === void 0 ? void 0 : temp3.appendChild(tileObj.createTile());
window.addEventListener("click", (event) => {
    const temp = event.target;
    console.log(temp.parentElement);
});
