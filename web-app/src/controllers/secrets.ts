import Docker from 'dockerode';
import { createDockerClient } from '../services/docker-client';

const docker = createDockerClient();

export class SecretsController {
    // Method to create a new Docker secret
    async createSecret(name: string, data: string): Promise<void> {
        try {
            await docker.createSecret({
                Name: name,
                Data: Buffer.from(data).toString('base64')
            });
        } catch (error) {
            throw new Error(`Failed to create secret: ${(error as Error).message}`);
        }
    }

    // Method to get all Docker secrets (renamed from listSecrets)
    async getSecrets(): Promise<any[]> {
        try {
            const secrets = await docker.listSecrets();
            return secrets;
        } catch (error) {
            throw new Error(`Failed to list secrets: ${(error as Error).message}`);
        }
    }

    // Method to inspect a single secret
    async inspectSecret(id: string): Promise<any> {
        try {
            const secret = docker.getSecret(id);
            return await secret.inspect();
        } catch (error) {
            throw new Error(`Failed to inspect secret: ${(error as Error).message}`);
        }
    }

    // Method to list all Docker secrets
    async listSecrets(): Promise<any[]> {
        return this.getSecrets();
    }

    // Method to update a Docker secret (Docker doesn't support updating secrets directly)
    async updateSecret(id: string, name: string, data: string): Promise<void> {
        // Remove the old secret and create a new one
        await this.removeSecret(id);
        await this.createSecret(name, data);
    }

    // Method to remove a Docker secret
    async removeSecret(id: string): Promise<void> {
        try {
            const secret = docker.getSecret(id);
            await secret.remove();
        } catch (error) {
            throw new Error(`Failed to remove secret: ${(error as Error).message}`);
        }
    }
}
