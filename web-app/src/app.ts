import express from 'express';
import path from 'path';
import { setRoutes } from './routes/index';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Set up routes
setRoutes(app);

app.listen(PORT, () => {
    console.log(`🚀 Docker Swarm Management Kit server is running on http://localhost:${PORT}`);
    console.log(`🔄 Hot reloading is enabled - the server will restart when you make changes!`);
});
