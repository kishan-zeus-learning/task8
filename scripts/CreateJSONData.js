const fs = require('fs');

const data=[];
const firstNames=["Suresh","Mahesh","Aditya","Rahul","Vikram","Harsh","Namit","Nikita","Lakshmi","Aarav"];
const lastNames=["Kumar","Prajapati","Shah","Gupta","Tripathi","Roy","Shetty","Yadav","Modi","Gandhi"];
const salaries=[1000000,1200000,1300000,2000000,1250000,900000,2700000,1100000,1050000,950000];

function getRandom0to9() {
  return Math.floor(Math.random() * 10);
}

function getRandom20to60() {
  return Math.floor(Math.random() * (60 - 20 + 1)) + 20;
}

for(let id=1;id<=50000;id++){
    data.push({
        "id":id,
        "firstName":firstNames[getRandom0to9()],
        "lastName":lastNames[getRandom0to9()],
        "Age":getRandom20to60(),
        "Salary":salaries[getRandom0to9()]
    });
}


const jsonData = JSON.stringify(data,null,2); 


fs.writeFile('data.json', jsonData, (err) => {
  if (err) {
    console.error('Error writing file', err);
  } else {
    console.log('JSON file has been saved.');
  }
});
