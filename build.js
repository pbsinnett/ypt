const fs = require('fs');
const path = require('path');
// Import the local JSZip file
const JSZip = require('./jszip.min.js');

// 1. Define your build output directories
const DIST_DIR = path.join(__dirname, 'dist');
const CHROME_DIR = path.join(DIST_DIR, 'chrome');
const FIREFOX_DIR = path.join(DIST_DIR, 'firefox');

// 2. Explicitly list the files and folders for the final extension
const TARGET_ASSETS = [
    'src/icons',
    'src/background.js',
    'src/options.html',
    'src/options.js',
    'src/tools.js',
];

// 3. Read base manifest
const baseManifestPath = path.join(__dirname, 'src/manifest.json');
const baseManifest = JSON.parse(fs.readFileSync(baseManifestPath, 'utf8'));

// 4. Browser overrides
const chromeOverrides = {
    background: { service_worker: "background.js" },
};

const firefoxOverrides = {
    background: { scripts: ["background.js"] },
    browser_specific_settings: {
        gecko: {
            id: "pbsinnett.dev@gmail.com", 
            strict_min_version: "109.0"
        }
    }
};

// --- HELPER: Recursively add folder contents to JSZip ---
function addDirectoryToZip(zipInstance, dirPath, zipFolderPrefix = '') {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            const newZipFolder = zipInstance.folder(zipFolderPrefix + item);
            addDirectoryToZip(newZipFolder, fullPath, '');
        } else {
            zipInstance.file(zipFolderPrefix + item, fs.readFileSync(fullPath));
        }
    }
}

// --- BUILD RUNNER ---
async function build() {
    console.log('🚀 Starting extension build and zip process...');

    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(CHROME_DIR, { recursive: true });
    fs.mkdirSync(FIREFOX_DIR, { recursive: true });

    // Step 1: Copy files to dist folders (FLATTENING THE SRC PREFIX)
    TARGET_ASSETS.forEach(asset => {
        const sourcePath = path.join(__dirname, asset);
        
        if (fs.existsSync(sourcePath)) {
            // path.basename('src/popup.html') outputs just 'popup.html'
            const destName = path.basename(asset); 
            
            fs.cpSync(sourcePath, path.join(CHROME_DIR, destName), { recursive: true });
            fs.cpSync(sourcePath, path.join(FIREFOX_DIR, destName), { recursive: true });
        } else {
            console.warn(`⚠️ Warning: Asset not found: ${asset}`);
        }
    });

    // Step 2: Write specific manifests directly to the build roots
    fs.writeFileSync(path.join(CHROME_DIR, 'manifest.json'), JSON.stringify({ ...baseManifest, ...chromeOverrides }, null, 4));
    fs.writeFileSync(path.join(FIREFOX_DIR, 'manifest.json'), JSON.stringify({ ...baseManifest, ...firefoxOverrides }, null, 4));

    console.log('📦 Folders staged! Compressing...');

    // Step 3: Zip Chrome Version
    const chromeZip = new JSZip();
    addDirectoryToZip(chromeZip, CHROME_DIR);
    const chromeBuffer = await chromeZip.generateAsync({ type: 'nodebuffer', compression: "DEFLATE", compressionOptions: { level: 5 } });
    fs.writeFileSync(path.join(DIST_DIR, 'NavigationSounds-Chrome.zip'), chromeBuffer);

    // Step 4: Zip Firefox Version
    const firefoxZip = new JSZip();
    addDirectoryToZip(firefoxZip, FIREFOX_DIR);
    const firefoxBuffer = await firefoxZip.generateAsync({ type: 'nodebuffer', compression: "DEFLATE", compressionOptions: { level: 5 } });
    fs.writeFileSync(path.join(DIST_DIR, 'NavigationSounds-Firefox.zip'), firefoxBuffer);

    console.log('✅ Build complete! Store-ready ZIP files are waiting in the /dist folder.');
}

build();