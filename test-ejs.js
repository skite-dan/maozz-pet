var ejs = require('./node_modules/ejs');
var fs = require('fs');

// Try compiling the full file
var str = fs.readFileSync('./views/admin/settings.ejs', 'utf8');
try {
  var fn = ejs.compile(str, { filename: './views/admin/settings.ejs' });
  console.log('FULL COMPILE OK');
} catch(e) {
  console.log('FULL COMPILE ERROR:', e.message);
  // Try to find the problematic line by binary search
  var lines = str.split('\n');
  console.log('Total lines:', lines.length);
  for (var i = 0; i < lines.length; i++) {
    var testStr = lines.slice(0, i+1).join('\n');
    try {
      ejs.compile(testStr, { filename: './views/admin/settings.ejs' });
    } catch(err) {
      console.log('Problem at line', i+1, ':', lines[i].substring(0, 80));
      break;
    }
  }
}
