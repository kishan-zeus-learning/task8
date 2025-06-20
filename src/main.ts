// const canvasTag= document.getElementById('myCanvas') as HTMLCanvasElement;
// const ctx = canvasTag.getContext("2d") as CanvasRenderingContext2D;
// // ctx.fillStyle = "blue";
// // let currentColor="blue";
// // for(let i=0;i<5;i++){
// //     if(currentColor==="blue"){
// //         currentColor="red";
// //     }else{
// //         currentColor="blue";
// //     }
// //     // console.log()
// //     // ctx.fillStyle=currentColor;
// //     ctx.font = "50px Arial";
// //     ctx.strokeText(`cell ${i}`,0,0)
// //     ctx.translate(30,0);
// //     // ctx.fillText=`cell ${i}`;
// // }


// ctx.font = "30px Arial";
// // const text = "Hello Canvas!";
// // const x = 20;
// // const y = 50;

// // // Measure the text
// // const metrics = ctx.measureText(text);
// // const padding = 10;
// // const textWidth = metrics.width;
// // const textHeight = 30; // approximate height — adjust to font size

// // // Draw rectangle border
// // ctx.strokeStyle = "black";
// // ctx.lineWidth = 2;
// // ctx.strokeRect(x - padding, y - textHeight, textWidth + padding * 2, textHeight + padding);

// // // Draw filled text
// // ctx.fillStyle = "red";
// // ctx.fillText(text, x, y);

// for(let i=1;i<=10;i++){
//     const text = `cell dfgdsfgdsfgdfsgsdfgdsfgdfgsdgsdgf${i}`;
//     const x = 20;
//     const y = 50;

//     // Measure the text
//     const metrics = ctx.measureText(text);
//     const padding = 10;
//     const textWidth = metrics.width;
//     const textHeight = 30; // approximate height — adjust to font size

//     // Draw rectangle border
//     ctx.strokeStyle = "black";
//     ctx.lineWidth = 2;
//     ctx.strokeRect(x - padding, y - textHeight, textWidth + padding * 2, textHeight + padding);

//     // Draw filled text
//     ctx.fillStyle = "red";
//     ctx.fillText(text, x, y);

//     ctx.translate(textWidth+padding*2,0)
// }


const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const dpr = window.devicePixelRatio || 1;
const cssWidth = 600;
const cssHeight = 400;

canvas.style.width = cssWidth + 'px';
canvas.style.height = cssHeight + 'px';

canvas.width = cssWidth * dpr;
canvas.height = cssHeight * dpr;

ctx.scale(dpr, dpr);

ctx.font = '16px Arial';
ctx.textBaseline = 'top';
ctx.textAlign = 'left';
ctx.fillText('Sharp text on canvas!', 10, 10);
