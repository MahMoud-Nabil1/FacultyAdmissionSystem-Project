const fs = require('fs');
const path = require('path');

const wrapperPath = path.join(__dirname, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

if (fs.existsSync(wrapperPath)) {
  let content = fs.readFileSync(wrapperPath, 'utf8');
  // Replace Gradle 9.x with 8.13
  content = content.replace(/gradle-9\.\d+\.\d+-bin\.zip/g, 'gradle-8.13-bin.zip');
  fs.writeFileSync(wrapperPath, content);
  console.log('Successfully downgraded Gradle wrapper to 8.13 for EAS build.');
} else {
  console.log('Gradle wrapper not found, skipping fix.');
}
