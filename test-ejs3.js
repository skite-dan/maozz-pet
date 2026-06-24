var ejs = require('./node_modules/ejs');
var fs = require('fs');
var str = fs.readFileSync('./views/admin/settings.ejs', 'utf8');
var lines = str.split('\n');

// Character-by-character search
for (var i = 0; i < lines.length; i++) {
  var line = lines[i];
  var testStr = lines.slice(0, i + 1).join('\n');
  // Remove include to isolate the problem
  testStr = testStr.replace(/<%- include\([^)]+\) %>/g, '');
  try {
    ejs.compile(testStr, { filename: './views/admin/settings.ejs' });
  } catch(err) {
    console.log('Problem at line', i + 1);
    console.log('Line content:', JSON.stringify(line));
    // Find exact character
    for (var j = 0; j < line.length; j++) {
      var partial = line.substring(0, j + 1);
      var prefix = lines.slice(0, i).join('\n') + '\n' + partial;
      prefix = prefix.replace(/<%- include\([^)]+\) %>/g, '');
      try {
        ejs.compile(prefix, { filename: './views/admin/settings.ejs' });
      } catch(e2) {
        console.log('Problem char at col', j + 1, 'char:', JSON.stringify(line[j]), 'code:', line.charCodeAt(j));
        break;
      }
    }
    break;
  }
}
