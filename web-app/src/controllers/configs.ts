import Docker from 'dockerode';
import { createDockerClient } from '../services/docker-client';

const docker = createDockerClient();

export class ConfigsController {
    // Method to create a new Docker config
    async createConfig(name: string, data: string): Promise<void> {
        try {
            await docker.createConfig({
                Name: name,
                Data: Buffer.from(data).toString('base64')
            });
        } catch (error) {
            throw new Error(`Failed to create config: ${(error as Error).message}`);
        }
    }

    // Method to get all Docker configs
    async getConfigs(): Promise<any[]> {
        try {
            const configs = await docker.listConfigs();
            return configs;
        } catch (error) {
            throw new Error(`Failed to list configs: ${(error as Error).message}`);
        }
    }

    // Method to inspect a single config
    async inspectConfig(id: string): Promise<any> {
        try {
            const config = docker.getConfig(id);
            return await config.inspect();
        } catch (error) {
            throw new Error(`Failed to inspect config: ${(error as Error).message}`);
        }
    }

    // Method to list all Docker configs (alias)
    async listConfigs(): Promise<any[]> {
        return this.getConfigs();
    }

    // Method to update a Docker config (Docker doesn't support updating configs directly)
    async updateConfig(id: string, name: string, data: string): Promise<void> {
        // Remove the old config and create a new one
        await this.removeConfig(id);
        await this.createConfig(name, data);
    }

    // Method to remove a Docker config
    async removeConfig(id: string): Promise<void> {
        try {
            const config = docker.getConfig(id);
            await config.remove();
        } catch (error) {
            throw new Error(`Failed to remove config: ${(error as Error).message}`);
        }
    }
}

export default ConfigsController;
