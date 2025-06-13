import { Application } from 'express';
import path from 'path';
import { setApiRoutes } from './api';

export function setRoutes(app: Application): void {
    // Serve the main HTML page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../public/index.html'));
    });

    // Set up API routes
    setApiRoutes(app);
}
