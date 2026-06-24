var ejs = require('./node_modules/ejs');
var fs = require('fs');

// Test 1: simple multiline
var t1 = '<%# comment %>\n<%\nvar x=1;\n%>';
try { ejs.compile(t1); console.log('t1 OK'); } catch(e) { console.log('t1 FAIL:', e.message); }

// Test 2: with body variable
var t2 = '<%# comment %>\n<%\nvar body = "";\nbody += "test";\n%>';
try { ejs.compile(t2); console.log('t2 OK'); } catch(e) { console.log('t2 FAIL:', e.message); }

// Test 3: read actual file first 3 lines
var lines = fs.readFileSync('./views/admin/settings.ejs', 'utf8').split('\n');
var t3 = lines.slice(0,3).join('\n');
console.log('t3 content:', JSON.stringify(t3));
try { ejs.compile(t3); console.log('t3 OK'); } catch(e) { console.log('t3 FAIL:', e.message); }

// Test 4: just the first 2 lines
var t4 = lines.slice(0,2).join('\n');
console.log('t4 content:', JSON.stringify(t4));
try { ejs.compile(t4); console.log('t4 OK'); } catch(e) { console.log('t4 FAIL:', e.message); }
