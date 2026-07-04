const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const filePath = 'D:\\workspace\\trae\\google_adv\\maozz-pet\\views\\index.ejs';

try {
  const template = fs.readFileSync(filePath, 'utf-8');
  console.log('File read OK, length:', template.length);

  // Try to compile the EJS template
  const compiledFn = ejs.compile(template, {
    filename: filePath,
    strict: false
  });

  console.log('EJS compile OK!');
  console.log('Compiled function type:', typeof compiledFn);

  // Try rendering with minimal data
  const html = compiledFn({
    title: 'Test',
    body: '',
    pageScript: ''
  });

  console.log('EJS render OK! Output length:', html.length);
  console.log('SUCCESS: All checks passed!');
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}
