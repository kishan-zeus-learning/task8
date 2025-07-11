export abstract class PointerEventHandlerBase {
    abstract hitTest(event: PointerEvent): boolean;

    abstract pointerDown(event:PointerEvent): void;

    abstract pointerMove(event:PointerEvent):void;

    abstract pointerUp(event:PointerEvent):void;
}