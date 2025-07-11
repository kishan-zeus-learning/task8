import { PointerEventHandlerBase } from "./PointerEventHandlerBase";
export class RowResizeEventHandler extends PointerEventHandlerBase {
    hitTest(event) {
        return false;
    }
    pointerDown(event) {
    }
    pointerMove(event) {
    }
    pointerUp(event) {
    }
}
