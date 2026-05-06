const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.match(/\.(js|jsx|ts|tsx)$/)) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'frontend', 'src'));
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1: template literal `http://localhost:5000/api/...`
    content = content.replace(/`http:\/\/localhost:5000\/api([^`]*)`/g, "`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}$1`");

    // Pattern 2: double quotes "http://localhost:5000/api/..."
    content = content.replace(/"http:\/\/localhost:5000\/api([^"]*)"/g, "`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}$1`");

    // Pattern 3: single quotes 'http://localhost:5000/api/...'
    content = content.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, "`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}$1`");

    // Let's skip api.js as it's already correctly handling the base URL
    if (content !== original && !file.endsWith('api.js')) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log("Updated: " + file);
    }
});
console.log("Total files updated: " + changedFiles);
