var ejs = require('./node_modules/ejs');

// Test the problematic pattern
var t1 = '<% var x = \'\\\'\\\'; %>';
console.log('t1:', JSON.stringify(t1));
try { ejs.compile(t1); console.log('t1 OK'); } catch(e) { console.log('t1 FAIL:', e.message); }

// Test with double backslash
var t2 = "<% var x = '\\\\'; %>";
console.log('t2:', JSON.stringify(t2));
try { ejs.compile(t2); console.log('t2 OK'); } catch(e) { console.log('t2 FAIL:', e.message); }

// Test the actual line from settings.ejs
var line = "pageScript += '    if (!str) return \\'\\';';";
var template = '<%\n' + line + '\n%>';
console.log('template:', JSON.stringify(template));
try { ejs.compile(template); console.log('template OK'); } catch(e) { console.log('template FAIL:', e.message); }
