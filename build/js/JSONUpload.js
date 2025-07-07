export class JSONUpload {
    constructor() {
        this.uploadedJSONData = null;
        this.inputElement = document.getElementById("jsonUpload");
        this.inputElement.addEventListener("change", (event) => {
            const input = event.target;
            if (!input.files || input.files.length === 0)
                return alert("No file selected");
            const file = input.files[0];
            if (!file.name.toLowerCase().endsWith(".json"))
                return alert("Please upload valid ");
            const reader = new FileReader();
            reader.onload = (event) => {
                var _a;
                try {
                    const json = JSON.parse((_a = event.target) === null || _a === void 0 ? void 0 : _a.result);
                    this.uploadedJSONData = json;
                    //logic
                    console.log("Json file loaded : ", this.uploadedJSONData);
                }
                catch (err) {
                    alert("Error : ");
                }
            };
            reader.readAsText(file);
        });
    }
}
