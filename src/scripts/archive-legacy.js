// scripts/archive-legacy.js
// Moves legacy HTML/JS panel/upload files into __archive_legacy safely.
// Usage: node scripts/archive-legacy.js

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const projectRoot = process.cwd();
const archiveRoot = path.join(projectRoot, '__archive_legacy');

// List of legacy paths to move (relative to project root)
const legacyPaths = [
  // HTML panels
  'public/components/closet-panel.html',
  'public/components/episodes-panel.html',
  'public/components/voice-panel.html',

  // Legacy panel system
  'src/components/pages/panels/panel-router.js',
  'src/components/pages/panels/seed-panel-registry.js',
  'src/js/app-init.js',
  'src/utils/form-injector.js',

  // Legacy dashboards
  'src/dashboard/closet-dashboard.jsx',
  'src/dashboard/episode-dashboard.js',
  'src/js/uploads/episode/episodes-dashboard.html',

  // Legacy upload forms + scripts
  'src/js/uploads/episodes-form.html',
  'src/js/uploads/voice/voice-upload.js',
  'src/js/uploads/voice/voice-upload-page.jsx',
  'src/js/uploads/episode/episodes-upload.js',
  'src/js/uploads/episode/index.js',

  // Legacy CSS
  'src/css/closet-panel.css',
  'src/css/upload-closet.css',
  'src/css/upload-episode.css',
  'src/css/upload-voice.css',

  // Legacy meta panel
  'src/meta/meta-panel.js',
  'src/css/meta-panel.css',
];

async function moveSafe(relPath) {
  const from = path.join(projectRoot, relPath);
  try {
    const stat = await fsp.stat(from);
    if (!stat.isFile() && !stat.isDirectory()) return;

    const dest = path.join(archiveRoot, relPath);
    await fsp.mkdir(path.dirname(dest), { recursive: true });

    // Move (rename). If cross-device, fallback to copy+remove.
    try {
      await fsp.rename(from, dest);
      console.log('Moved:', relPath);
    } catch (err) {
      if (err.code === 'EXDEV') {
        await fsp.copyFile(from, dest);
        await fsp.unlink(from);
        console.log('Copied & removed (cross-device):', relPath);
      } else {
        throw err;
      }
    }
  } catch (e) {
    // File missing is OK
    if (e.code !== 'ENOENT') {
      console.warn('Skipping with error:', relPath, e.message);
    }
  }
}

(async function main(){
  await fsp.mkdir(archiveRoot, { recursive: true });
  for (const p of legacyPaths) {
    await moveSafe(p);
  }
  console.log('\nDone. Review __archive_legacy/ and test before deleting permanently.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
