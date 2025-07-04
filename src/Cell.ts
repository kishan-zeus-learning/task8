export class Cell{
    readonly row:number;
    readonly column:number;
    private value:string;
    readonly leftAlign:boolean;

    constructor(row:number,column:number,value:string=""){
        this.row=row;
        this.column=column;
        this.value=value;
        this.leftAlign=!Number.isFinite(Number(value));
    }

    setValue(value:string){
        this.value=value;
    }

    getValue(){
        return this.value;
    }

    
}