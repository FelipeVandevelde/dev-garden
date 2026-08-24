const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.error("Dist directory not found. Run build first.");
  process.exit(1);
}

const files = walk(distDir);
let leakFound = false;

for (const file of files) {
  if (file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.js')) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('SECRET_LEAK_STRING') || content.includes('DRAFT_LEAK_STRING')) {
      console.error(`[QUARANTINE FAILED] Leaked secret found in: ${file}`);
      leakFound = true;
    }
  }
}

if (leakFound) {
  process.exit(1);
} else {
  console.log("[QUARANTINE PASSED] No drafts or private notes leaked into dist.");
  process.exit(0);
}