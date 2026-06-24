var ejs = require('./node_modules/ejs');
var fs = require('fs');
var str = fs.readFileSync('./views/admin/settings.ejs', 'utf8');

// Binary search for problematic line
var lines = str.split('\n');
var low = 0, high = lines.length;

while (low < high) {
  var mid = Math.floor((low + high) / 2);
  var testStr = lines.slice(0, mid + 1).join('\n');
  try {
    ejs.compile(testStr, { filename: './views/admin/settings.ejs' });
    low = mid + 1;
  } catch(err) {
    high = mid;
  }
}

console.log('First problematic line:', low + 1);
console.log('Content:', JSON.stringify(lines[low]));
