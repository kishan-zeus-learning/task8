/**
 * Base abstract class for handling pointer events.
 * Subclasses must implement hit testing and pointer event handling methods.
 */
export abstract class PointerEventHandlerBase {
    /**
     * Determines if the pointer event should be handled by this event handler.
     * @param {PointerEvent} event - The pointer event to test
     * @returns {boolean} True if the event target is relevant
     */
    abstract hitTest(event: PointerEvent): boolean;

    /**
     * Called when a pointer is pressed down on a valid target.
     * @param {PointerEvent} event - The pointer down event
     */
    abstract pointerDown(event: PointerEvent): void;

    /**
     * Called when a pointer moves over a valid target.
     * @param {PointerEvent} event - The pointer move event
     */
    abstract pointerMove(event: PointerEvent): void;

    /**
     * Called when a pointer is released after interaction.
     * @param {PointerEvent} event - The pointer up event
     */
    abstract pointerUp(event: PointerEvent): void;
}
