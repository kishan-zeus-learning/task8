export class ScrollManager {
    constructor() {
        this.minHeight = 18;
        this.minWidth = 40;
        this.gridDiv = document.getElementById("grid");
        this.sheetDiv = document.getElementById("sheet");
        this.verticalNum = this.minVerticalDiv() + 2;
        this.horizontalNum = this.minHorizontalDiv() + 2;
        console.log("total divs : ", this.verticalNum, this.horizontalNum);
        this.scrollListener();
    }
    minVerticalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / (this.minHeight)) / 25);
    }
    minHorizontalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / (this.minWidth)) / 25);
    }
    scrollListener() {
        let lastScrollTop = this.sheetDiv.scrollTop;
        let lastScrollLeft = this.sheetDiv.scrollLeft;
        this.sheetDiv.addEventListener("scroll", (event) => {
            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;
            if (currentScrollTop > lastScrollTop) {
                this.handleScrollDown(event);
            }
            else if (currentScrollTop < lastScrollTop) {
                this.handleScrollUp(event);
            }
            else if (currentScrollLeft > lastScrollLeft) {
                this.handleScrollRight(event);
            }
            else {
                this.handleScrollLeft(event);
            }
            lastScrollLeft = currentScrollLeft;
            lastScrollTop = currentScrollTop;
        });
    }
    handleScrollDown(event) {
    }
    handleScrollUp(event) {
    }
    handleScrollRight(event) {
    }
    handleScrollLeft(event) {
    }
}
new ScrollManager();
