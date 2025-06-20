const editBlock=document.getElementById('editBlock') as HTMLDivElement;
const editBlockInput=document.getElementById('editBlockInput') as HTMLInputElement;

  const canvasTag2 = document.getElementById('myCanvas2') as HTMLCanvasElement;
  console.log(canvasTag2);
const ctx2= canvasTag2.getContext("2d") as CanvasRenderingContext2D;
ctx2.strokeStyle="gray";
ctx2.font = "14px Arial";
ctx2.textBaseline="top";
ctx2.scale(1,1);
let width=80;
let height=20;
  for(let i=0;i<20;i++){
    for(let j=0;j<20;j++){
        ctx2.strokeRect(i*width,j*height,width,height);
        ctx2.fillText(`cell${i}${j}`,i*width,j*height);
    }
  }

canvasTag2.addEventListener('click',(event)=>{
    // console.log(event.offsetX,event.offsetY);
    let x=event.offsetX;
    let y=event.offsetY;

    let row=Math.floor(x/width);
    let col=Math.floor(y/height);

    console.log(row,col);
    editBlock.style.display="block";
    editBlock.style.top=`${height*col}px`;
    editBlock.style.left=`${width*row}px`;
});

editBlock.addEventListener('dblclick',(event)=>{
    editBlockInput.style.display="block";
});
// editBlock.addEventListener('')
