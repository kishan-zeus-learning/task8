export class JSONUpload{
    uploadedJSONData:JSON|null=null;
    private inputElement:HTMLInputElement=document.getElementById("jsonUpload") as HTMLInputElement;
    constructor(){
        this.inputElement.addEventListener("change",(event)=>{
            const input=event.target as HTMLInputElement;

            if(!input.files || input.files.length===0) return alert("No file selected");

            const file:File = input.files[0];

            if(!file.name.toLowerCase().endsWith(".json")) return alert("Please upload valid ")
            const reader = new FileReader();

            reader.onload = (event)=>{
                try{
                    const json = JSON.parse(event.target?.result as string);

                    this.uploadedJSONData=json;

                    //logic

                    console.log("Json file loaded : ",this.uploadedJSONData);
                    
                }catch(err){
                    alert("Error : ");
                }
            };

            reader.readAsText(file);
        })
    }
}