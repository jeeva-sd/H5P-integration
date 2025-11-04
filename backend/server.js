const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const cors = require('cors');
const i18next = require('i18next');
const i18nextFsBackend = require('i18next-fs-backend');
const i18nextHttpMiddleware = require('i18next-http-middleware');
const { h5pAjaxExpressRouter } = require('@lumieducation/h5p-express');
const H5P = require('@lumieducation/h5p-server');

const app = express();
const PORT = 3001;

// Middleware - CORS must allow credentials for proper H5P integration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

// Simple user mock
const mockUser = { 
    id: '1', 
    name: 'User', 
    canInstallRecommended: true, 
    canUpdateAndInstallLibraries: true, 
    canCreateRestricted: true, 
    type: 'local',
    email: 'user@example.com'
};

const start = async () => {
    // Initialize i18next
    await i18next
        .use(i18nextFsBackend)
        .use(i18nextHttpMiddleware.LanguageDetector)
        .init({
            backend: {
                loadPath: path.join(__dirname, '../node_modules/@lumieducation/h5p-server/build/assets/translations/{{ns}}/{{lng}}.json')
            },
            fallbackLng: 'en',
            preload: ['en'],
            ns: ['client', 'server', 'storage-file-implementations', 'hub', 'library-metadata', 'metadata-semantics', 'copyright-semantics']
        });

    // Load H5P config
    const config = await new H5P.H5PConfig(
        new H5P.fsImplementations.JsonStorage(path.join(__dirname, 'config/h5p-config.json'))
    ).load();

    // Create H5P Editor using the correct constructor pattern
    const h5pEditor = H5P.fs(
        config,
        path.join(__dirname, 'h5p/libraries'),
        path.join(__dirname, 'h5p/content'),
        path.join(__dirname, 'h5p/temporary-storage'),
        (key, language) => i18next.t(key, { lng: language })
    );

    // Create H5P Player
    const h5pPlayer = new H5P.H5PPlayer(
        h5pEditor.libraryStorage,
        h5pEditor.contentStorage,
        config,
        undefined,
        undefined,
        (key, language) => i18next.t(key, { lng: language })
    );

    // Inject user into requests
    app.use((req, res, next) => {
        req.user = mockUser;
        req.language = 'en';
        req.languages = ['en'];
        req.t = i18next.t;
        next();
    });

    // Add i18next middleware
    app.use(i18nextHttpMiddleware.handle(i18next));

    // Serve static H5P core and editor files
    app.use('/h5p/core', express.static(path.join(__dirname, 'h5p/core')));
    app.use('/h5p/editor', express.static(path.join(__dirname, 'h5p/editor')));

    // H5P Ajax endpoints
    app.use(
        config.baseUrl,
        h5pAjaxExpressRouter(
            h5pEditor,
            path.join(__dirname, 'h5p/core'),
            path.join(__dirname, 'h5p/editor'),
            undefined,
            'en'
        )
    );

    // API: Get all content
    app.get('/api/content', async (req, res) => {
        try {
            const contentIds = await h5pEditor.contentManager.listContent();
            const contentList = await Promise.all(
                contentIds.map(async (id) => {
                    try {
                        const content = await h5pEditor.contentManager.getContentMetadata(id, req.user);
                        return { id, title: content.title, mainLibrary: content.mainLibrary };
                    } catch (err) {
                        console.error(`Error loading content ${id}:`, err.message);
                        return null;
                    }
                })
            );
            res.json(contentList.filter(c => c !== null));
        } catch (error) {
            console.error('Error listing content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // API: Get single content for playing
    app.get('/api/content/:id', async (req, res) => {
        try {
            const h5pPage = await h5pPlayer.render(req.params.id, req.user, 'en');
            res.send(h5pPage);
        } catch (error) {
            console.error('Error rendering content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Serve the editor page (full HTML) - This works when accessed directly
    app.get('/edit/:contentId', async (req, res) => {
        try {
            const page = await h5pEditor.render(
                req.params.contentId === 'new' ? undefined : req.params.contentId,
                'en',
                req.user
            );
            
            // Add headers to allow iframe embedding if needed
            res.setHeader('X-Frame-Options', 'ALLOW-FROM http://localhost:5173');
            res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:5173 http://localhost:3000");
            
            res.send(page);
        } catch (error) {
            console.error('Error rendering editor:', error);
            res.status(500).send(`Error: ${error.message}`);
        }
    });

    // API: Save/create content
    app.post('/api/content/:contentId', async (req, res) => {
        try {
            const { library, params } = req.body;
            
            if (!library || !params) {
                return res.status(400).json({ error: 'Missing library or params' });
            }

            const contentId = await h5pEditor.saveOrUpdateContent(
                req.params.contentId === 'new' ? undefined : req.params.contentId,
                params.params,
                params.metadata,
                library,
                req.user
            );
            
            res.json({ contentId });
        } catch (error) {
            console.error('Error saving content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // API: Delete content
    app.delete('/api/content/:id', async (req, res) => {
        try {
            await h5pEditor.deleteContent(req.params.id, req.user);
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Unhandled error:', err);
        res.status(500).json({ 
            error: err.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    });

    app.listen(PORT, () => {
        console.log(`\n🚀 H5P Backend server running!`);
        console.log(`📍 Server: http://localhost:${PORT}`);
        console.log(`📝 API: http://localhost:${PORT}/api`);
        console.log(`🎨 H5P Editor: http://localhost:${PORT}/edit/new`);
        console.log(`\n✅ Ready to accept requests!\n`);
    });
};

start().catch(err => {
    console.error('❌ Failed to start server:', err);
    console.error(err.stack);
    process.exit(1);
});
