import { Router, Application } from 'express';
import { SecretsController } from '../controllers/secrets';
import { ConfigsController } from '../controllers/configs';

const router = Router();
const secretsController = new SecretsController();
const configsController = new ConfigsController();

export function setApiRoutes(app: Application): void {
    // Secrets routes
    router.get('/secrets', async (req, res) => {
        try {
            const secrets = await secretsController.getSecrets();
            res.json(secrets);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.post('/secrets', async (req, res) => {
        try {
            const { name, data } = req.body;
            await secretsController.createSecret(name, data);
            res.status(201).json({ message: 'Secret created successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.get('/secrets/:id', async (req, res) => {
        try {
            const secret = await secretsController.inspectSecret(req.params.id);
            res.json(secret);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.put('/secrets/:id', async (req, res) => {
        try {
            const { name, data } = req.body;
            await secretsController.updateSecret(req.params.id, name, data);
            res.json({ message: 'Secret updated successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.delete('/secrets/:id', async (req, res) => {
        try {
            await secretsController.removeSecret(req.params.id);
            res.json({ message: 'Secret deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Configs routes
    router.get('/configs', async (req, res) => {
        try {
            const configs = await configsController.getConfigs();
            res.json(configs);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.post('/configs', async (req, res) => {
        try {
            const { name, data } = req.body;
            await configsController.createConfig(name, data);
            res.status(201).json({ message: 'Config created successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.get('/configs/:id', async (req, res) => {
        try {
            const config = await configsController.inspectConfig(req.params.id);
            res.json(config);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.put('/configs/:id', async (req, res) => {
        try {
            const { name, data } = req.body;
            await configsController.updateConfig(req.params.id, name, data);
            res.json({ message: 'Config updated successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    router.delete('/configs/:id', async (req, res) => {
        try {
            await configsController.removeConfig(req.params.id);
            res.json({ message: 'Config deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    app.use('/api', router);
}
