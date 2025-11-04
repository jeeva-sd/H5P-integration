const H5P = require('@lumieducation/h5p-server');
const path = require('path');
const fs = require('fs').promises;

async function installH5P() {
    console.log('🔧 Setting up H5P...');
    
    // Load config
    const config = await new H5P.H5PConfig(
        new H5P.fsImplementations.JsonStorage(path.join(__dirname, 'config/h5p-config.json'))
    ).load();

    // Create H5P Editor
    const h5pEditor = H5P.fs(
        config,
        path.join(__dirname, 'h5p/libraries'),
        path.join(__dirname, 'h5p/content'),
        path.join(__dirname, 'h5p/temporary-storage'),
        (key, lang) => key
    );

    console.log('📥 Updating content type cache from H5P Hub...');
    await h5pEditor.contentTypeCache.updateIfNecessary();

    // Install popular content types
    const mockUser = { 
        id: '1', 
        canInstallRecommended: true, 
        canUpdateAndInstallLibraries: true 
    };

    const contentTypesToInstall = [
        'H5P.InteractiveVideo',
        'H5P.CoursePresentation',
        'H5P.MultiChoice',
        'H5P.Blanks',
        'H5P.DragQuestion',
        'H5P.Summary',
        'H5P.Accordion'
    ];

    console.log('\n📦 Installing popular H5P content types...');
    
    for (const machineName of contentTypesToInstall) {
        try {
            console.log(`  ⏳ Installing ${machineName}...`);
            await h5pEditor.libraryManager.installLibraryFromHub(machineName, mockUser);
            console.log(`  ✅ ${machineName} installed successfully`);
        } catch (err) {
            console.log(`  ⚠️  ${machineName}: ${err.message}`);
        }
    }

    console.log('\n✅ H5P setup complete!');
    console.log('\nInstalled content types are ready to use.');
    console.log('You can now start the server with: npm run dev');
}

installH5P().catch(err => {
    console.error('❌ Error setting up H5P:', err);
    console.error(err.stack);
    process.exit(1);
});
