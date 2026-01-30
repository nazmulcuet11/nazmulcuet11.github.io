const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

const dataFiles = [
  'meta.json',
  'profile.json',
  'experience.json',
  'skills.json',
  'projects.json',
  'contact.json',
];

function loadJson(name) {
  const filePath = path.join(dataDir, name);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function mergeData() {
  const meta = loadJson('meta.json');
  const profile = loadJson('profile.json');
  const experience = loadJson('experience.json');
  const skills = loadJson('skills.json');
  const projects = loadJson('projects.json');
  const contact = loadJson('contact.json');

  const merged = {
    ...meta,
    ...profile,
    ...experience,
    ...skills,
    ...projects,
    ...contact,
  };

  // Preprocess projects: convert newlines in modalDescription to <br> for HTML output
  if (merged.projects && Array.isArray(merged.projects)) {
    merged.projects = merged.projects.map((p) => ({
      ...p,
      modalDescriptionHtml: (p.modalDescription || '')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>'),
    }));
  }

  return merged;
}

function build() {
  const data = mergeData();
  const templatePath = path.join(srcDir, 'index.hbs');
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(templateSource);
  const html = template(data);

  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

  // Copy static assets to dist
  const assets = ['css', 'images', 'scripts', 'resources'];
  for (const dir of assets) {
    const srcPath = path.join(rootDir, dir);
    const destPath = path.join(distDir, dir);
    if (fs.existsSync(srcPath)) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    }
  }

  // Copy CNAME for custom domain (GitHub Pages)
  const cnamePath = path.join(rootDir, 'CNAME');
  if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(distDir, 'CNAME'));
  }

  console.log('Build complete. Output in dist/');
}

build();
