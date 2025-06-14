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

    // Method to update a Docker secret with rolling update strategy
    async updateSecret(id: string, name: string, data: string): Promise<void> {
        try {
            // Get the current secret details
            const currentSecret = await this.inspectSecret(id);
            const currentName = currentSecret.Spec.Name;

            // Find services that use this secret
            const affectedServices = await this.findServicesUsingSecret(id);

            if (affectedServices.length === 0) {
                // Simple case: no services using this secret
                await this.removeSecret(id);
                await this.createSecret(name, data);
                return;
            }

            // Rolling update strategy for secrets in use
            const tempSecretName = `${currentName}-temp-${Date.now()}`;

            // Step 1: Create temporary secret with old data
            await this.createSecret(tempSecretName, Buffer.from(currentSecret.Spec.Data, 'base64').toString());

            // Step 2: Update all affected services to use temporary secret
            for (const service of affectedServices) {
                await this.updateServiceSecret(service, currentName, tempSecretName);
            }

            // Step 3: Remove the old secret
            await this.removeSecret(id);

            // Step 4: Create new secret with updated data
            await this.createSecret(name, data);

            // Step 5: Update services back to the new secret
            for (const service of affectedServices) {
                await this.updateServiceSecret(service, tempSecretName, name);
            }

            // Step 6: Clean up temporary secret
            const tempSecrets = await docker.listSecrets({ filters: { name: [tempSecretName] } });
            if (tempSecrets.length > 0) {
                const tempSecret = docker.getSecret(tempSecrets[0].ID);
                await tempSecret.remove();
            }

        } catch (error) {
            throw new Error(`Failed to update secret: ${(error as Error).message}`);
        }
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

    // Enhanced method to update a Docker secret with rolling update strategy and rollback
    async updateSecretSafe(id: string, name: string, data: string): Promise<void> {
        let tempSecretName: string | null = null;
        let affectedServices: any[] = [];
        let rollbackRequired = false;
        let currentName = '';

        try {
            // Get the current secret details
            const currentSecret = await this.inspectSecret(id);
            currentName = currentSecret.Spec.Name;

            // Find services that use this secret
            affectedServices = await this.findServicesUsingSecret(id);

            if (affectedServices.length === 0) {
                // Simple case: no services using this secret
                await this.removeSecret(id);
                await this.createSecret(name, data);
                return;
            }

            // Rolling update strategy for secrets in use
            tempSecretName = `${currentName}-temp-${Date.now()}`;

            // Step 1: Create temporary secret with old data
            await this.createSecret(tempSecretName, Buffer.from(currentSecret.Spec.Data, 'base64').toString());
            rollbackRequired = true;

            // Step 2: Update all affected services to use temporary secret
            for (const service of affectedServices) {
                await this.updateServiceSecret(service, currentName, tempSecretName);
            }

            // Step 3: Remove the old secret
            await this.removeSecret(id);

            // Step 4: Create new secret with updated data
            await this.createSecret(name, data);

            // Step 5: Update services back to the new secret
            for (const service of affectedServices) {
                await this.updateServiceSecret(service, tempSecretName, name);
            }

            // Step 6: Clean up temporary secret
            await this.cleanupTempSecret(tempSecretName);

        } catch (error) {
            // Rollback on failure
            if (rollbackRequired && tempSecretName) {
                await this.rollbackSecretUpdate(affectedServices, tempSecretName, currentName);
            }
            throw new Error(`Failed to update secret: ${(error as Error).message}`);
        }
    }

    // Helper method to cleanup temporary secret
    private async cleanupTempSecret(tempSecretName: string): Promise<void> {
        try {
            const tempSecrets = await docker.listSecrets({ filters: { name: [tempSecretName] } });
            if (tempSecrets.length > 0) {
                const tempSecret = docker.getSecret(tempSecrets[0].ID);
                await tempSecret.remove();
            }
        } catch (error) {
            // Log but don't fail on cleanup errors
            console.warn(`Warning: Failed to cleanup temporary secret ${tempSecretName}:`, error);
        }
    }

    // Helper method to rollback secret update
    private async rollbackSecretUpdate(affectedServices: any[], tempSecretName: string, originalSecretName: string): Promise<void> {
        try {
            // Try to rollback services to use the temporary secret (which has original data)
            for (const service of affectedServices) {
                try {
                    await this.updateServiceSecret(service, originalSecretName, tempSecretName);
                } catch (rollbackError) {
                    console.error(`Failed to rollback service ${service.ID}:`, rollbackError);
                }
            }
        } catch (error) {
            console.error('Rollback failed:', error);
        }
    }

    // Helper method to find services using a specific secret
    private async findServicesUsingSecret(secretId: string): Promise<any[]> {
        try {
            const services = await docker.listServices();
            const affectedServices = [];

            for (const service of services) {
                const serviceSpec = service.Spec;
                const taskTemplate = serviceSpec?.TaskTemplate;

                // Check if TaskTemplate has ContainerSpec (not PluginSpec)
                if (taskTemplate && 'ContainerSpec' in taskTemplate && taskTemplate.ContainerSpec?.Secrets) {
                    const usesSecret = taskTemplate.ContainerSpec.Secrets.some(
                        (secret: any) => secret.SecretID === secretId
                    );
                    if (usesSecret) {
                        affectedServices.push(service);
                    }
                }
            }

            return affectedServices;
        } catch (error) {
            throw new Error(`Failed to find services using secret: ${(error as Error).message}`);
        }
    }

    // Helper method to update a service's secret reference
    private async updateServiceSecret(service: any, oldSecretName: string, newSecretName: string): Promise<void> {
        try {
            const serviceSpec = { ...service.Spec };
            const taskTemplate = serviceSpec.TaskTemplate;

            if (taskTemplate && 'ContainerSpec' in taskTemplate && taskTemplate.ContainerSpec?.Secrets) {
                // Find and update the secret reference
                taskTemplate.ContainerSpec.Secrets = taskTemplate.ContainerSpec.Secrets.map((secret: any) => {
                    if (secret.SecretName === oldSecretName) {
                        return {
                            ...secret,
                            SecretName: newSecretName
                        };
                    }
                    return secret;
                });
            }

            // Update the service with new specification
            const serviceObj = docker.getService(service.ID);
            await serviceObj.update({
                version: service.Version.Index,
                ...serviceSpec
            });

            // Wait for service update to complete
            await this.waitForServiceUpdate(service.ID);

        } catch (error) {
            throw new Error(`Failed to update service secret reference: ${(error as Error).message}`);
        }
    }

    // Helper method to wait for service update completion
    private async waitForServiceUpdate(serviceId: string, maxWaitTime: number = 60000): Promise<void> {
        const startTime = Date.now();
        const pollInterval = 2000; // 2 seconds

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const service = docker.getService(serviceId);
                const serviceInfo = await service.inspect();

                // Check if update is complete by comparing UpdateStatus
                const updateStatus = serviceInfo.UpdateStatus;
                if (!updateStatus || updateStatus.State === 'completed') {
                    return;
                }

                if (updateStatus.State === 'failed') {
                    throw new Error(`Service update failed: ${updateStatus.Message || 'Unknown error'}`);
                }

            } catch (error) {
                // If service doesn't exist or other error, consider update complete
                return;
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error(`Service update timeout after ${maxWaitTime}ms`);
    }
}
