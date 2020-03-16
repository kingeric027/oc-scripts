const fs = require('fs');
const csv=require('csvtojson')
const csvStr = fs.readFileSync('./country fix.csv', { encoding: 'utf8'}); 
csv()
.fromString(csvStr)
.then((csvRow)=>{ 
    console.log(JSON.stringify(csvRow, null, 4)) // => [["1","2","3"], ["4","5","6"], ["7","8","9"]]
})