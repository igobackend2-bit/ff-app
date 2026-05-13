const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'output.log');

try {
  const buffer = fs.readFileSync(logPath);
  // Try both encodings and search for the pattern
  const contentUtf16 = buffer.toString('utf16le');
  const contentUtf8 = buffer.toString('utf8');
  
  function extract(content, label) {
    console.log(`--- SEARCHING ${label} ---`);
    let index = -1;
    while ((index = content.indexOf('DEBUG_OTP', index + 1)) !== -1) {
      console.log('FOUND AT INDEX', index);
      // Print 60 chars after
      console.log('DATA:', content.substring(index, index + 80).replace(/[\r\n]/g, ' '));
    }
  }

  extract(contentUtf16, 'UTF-16LE');
  extract(contentUtf8, 'UTF-8');
} catch (err) {
  console.error('Error reading log:', err);
}
