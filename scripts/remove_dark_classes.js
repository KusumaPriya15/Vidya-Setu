const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      let rawPath = path.join(dir, f);
      // Skip unwanted directories
      if (!rawPath.includes('node_modules') && !rawPath.includes('.git') && !rawPath.includes('dist') && !rawPath.includes('.gemini') && !rawPath.includes('New folder')) {
        try {
          let stat = fs.statSync(rawPath);
          if (stat.isDirectory()) walkDir(rawPath, callback);
          else callback(rawPath);
        } catch (e) {}
      }
    });
  } catch (err) {}
}

walkDir('c:\\Users\\Deepak\\Downloads\\Vidya-Setu_Orchids-main', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      // Remove dark:* classes. Notice the hyphen is at the END of the bracket to avoid range error.
      content = content.replace(/dark:[a-zA-Z0-9_\/]+/g, ''); // not getting hyphenated classes here to be safe
      // just to be completely safe and get hyphens too:
      content = content.replace(/dark:[-a-zA-Z0-9_/]+/g, '');
      
      // Clean up empty spaces in className
      content = content.replace(/ className="([^"]+)"/g, (match, p1) => {
          let clean = p1.replace(/\s+/g, ' ').trim();
          return clean ? ` className="${clean}"` : ``;
      });
      content = content.replace(/ className=\{`([^`]+)`\}/g, (match, p1) => {
          let clean = p1.replace(/ +/g, ' ').trim();
          return clean ? ` className={\`${clean}\`}` : ``;
      });

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
      }
    } catch (err) {
      console.log('Error reading/writing ' + filePath, err.message);
    }
  }
});
