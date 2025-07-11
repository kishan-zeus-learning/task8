import { ColumnsManager } from "../ColumnsManager.js";
import { RowsManager } from "../RowsManager.js";
import { TilesManager } from "../TilesManager.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { ColumnsResizeEventHandler } from "./ColumnResizeEventHandler.js";
import { ColumnSelectionEventHandler } from "./ColumnSelectionEventHandler.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
import {  RowResizeEventHandler } from "./RowResizeEventHandler.js";
import { RowSelectionEventHandler } from "./RowSelectionEventHandler.js";

export class InteractionManager{
    private rowsManager:RowsManager;
    private columnsManager:ColumnsManager;
    private tilesManager:TilesManager;
    private selectionCoordinates:MultipleSelectionCoordinates;
    private undoRedoManager:UndoRedoManager;
    private featuresArray: PointerEventHandlerBase[];
    private activeFeature:PointerEventHandlerBase|null=null;
    constructor(
        rowsManager:RowsManager,
        columnsManager:ColumnsManager,
        tilesManager:TilesManager,
        selectionCoordinates:MultipleSelectionCoordinates,
        undoRedoManager:UndoRedoManager
    ){
        this.rowsManager=rowsManager;
        this.columnsManager=columnsManager;
        this.tilesManager=tilesManager;
        this.selectionCoordinates=selectionCoordinates;
        this.undoRedoManager=undoRedoManager;
        this.featuresArray=this.getArray();
        console.log("initialized : ",this.featuresArray);

        this.initializeEventListeners();

    }

    private getArray(){
        const RowResizeEventHandlerObj=new RowResizeEventHandler(this.rowsManager,this.tilesManager,this.undoRedoManager);
        const ColumnsResizeEventHandlerObj=new ColumnsResizeEventHandler(this.columnsManager,this.tilesManager,this.undoRedoManager);

        const RowSelectionEventHandlerObj=new RowSelectionEventHandler(this.rowsManager,this.columnsManager,this.tilesManager,this.selectionCoordinates);

        const ColumnSelectionEventHandlerObj=new ColumnSelectionEventHandler(this.rowsManager,this.columnsManager,this.tilesManager,this.selectionCoordinates);

        return [RowResizeEventHandlerObj,ColumnsResizeEventHandlerObj,RowSelectionEventHandlerObj,ColumnSelectionEventHandlerObj];
    }

    private initializeEventListeners(){
        const sheetDiv=document.getElementById("sheet") as HTMLDivElement;

        sheetDiv.addEventListener("pointerdown",(event)=>{
            this.handlePointerDown(event);
        });


        window.addEventListener("pointermove",(event)=>{
            this.handlePointerMove(event);
        });

        window.addEventListener("pointerup",(event)=>{
            this.handlePointerUp(event);
        });
    }

    private handlePointerDown(event:PointerEvent){
        if(this.activeFeature) return alert("some error occured at interaction manager pointer down");
            for(const currentFeature of this.featuresArray){
                if(currentFeature.hitTest(event)){
                    this.activeFeature=currentFeature;
                    this.activeFeature.pointerDown(event);
                    break;
                }
            }
    }

    private handlePointerMove(event:PointerEvent){
        if(!this.activeFeature) return;

        this.activeFeature.pointerMove(event);
    }

    private handlePointerUp(event:PointerEvent){
        if(!this.activeFeature) return ;
        this.activeFeature.pointerUp(event);
        this.activeFeature=null;
    }
    
}