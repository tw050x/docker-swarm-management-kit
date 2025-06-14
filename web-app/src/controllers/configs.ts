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

    // Method to update a Docker config with rolling update strategy
    async updateConfig(id: string, name: string, data: string): Promise<void> {
        try {
            // Get the current config details
            const currentConfig = await this.inspectConfig(id);
            const currentName = currentConfig.Spec.Name;

            // Find services that use this config
            const affectedServices = await this.findServicesUsingConfig(id);

            if (affectedServices.length === 0) {
                // Simple case: no services using this config
                await this.removeConfig(id);
                await this.createConfig(name, data);
                return;
            }

            // Rolling update strategy for configs in use
            const tempConfigName = `${currentName}-temp-${Date.now()}`;

            // Step 1: Create temporary config with old data
            await this.createConfig(tempConfigName, Buffer.from(currentConfig.Spec.Data, 'base64').toString());

            // Step 2: Update all affected services to use temporary config
            for (const service of affectedServices) {
                await this.updateServiceConfig(service, currentName, tempConfigName);
            }

            // Step 3: Remove the old config
            await this.removeConfig(id);

            // Step 4: Create new config with updated data
            await this.createConfig(name, data);

            // Step 5: Update services back to the new config
            for (const service of affectedServices) {
                await this.updateServiceConfig(service, tempConfigName, name);
            }

            // Step 6: Clean up temporary config
            const tempConfigs = await docker.listConfigs({ filters: { name: [tempConfigName] } });
            if (tempConfigs.length > 0) {
                const tempConfig = docker.getConfig(tempConfigs[0].ID);
                await tempConfig.remove();
            }

        } catch (error) {
            throw new Error(`Failed to update config: ${(error as Error).message}`);
        }
    }

    // Enhanced method to update a Docker config with rolling update strategy and rollback
    async updateConfigSafe(id: string, name: string, data: string): Promise<void> {
        let tempConfigName: string | null = null;
        let affectedServices: any[] = [];
        let rollbackRequired = false;
        let currentName = '';

        try {
            // Get the current config details
            const currentConfig = await this.inspectConfig(id);
            currentName = currentConfig.Spec.Name;

            // Find services that use this config
            affectedServices = await this.findServicesUsingConfig(id);

            if (affectedServices.length === 0) {
                // Simple case: no services using this config
                await this.removeConfig(id);
                await this.createConfig(name, data);
                return;
            }

            // Rolling update strategy for configs in use
            tempConfigName = `${currentName}-temp-${Date.now()}`;

            // Step 1: Create temporary config with old data
            await this.createConfig(tempConfigName, Buffer.from(currentConfig.Spec.Data, 'base64').toString());
            rollbackRequired = true;

            // Step 2: Update all affected services to use temporary config
            for (const service of affectedServices) {
                await this.updateServiceConfig(service, currentName, tempConfigName);
            }

            // Step 3: Remove the old config
            await this.removeConfig(id);

            // Step 4: Create new config with updated data
            await this.createConfig(name, data);

            // Step 5: Update services back to the new config
            for (const service of affectedServices) {
                await this.updateServiceConfig(service, tempConfigName, name);
            }

            // Step 6: Clean up temporary config
            await this.cleanupTempConfig(tempConfigName);

        } catch (error) {
            // Rollback on failure
            if (rollbackRequired && tempConfigName) {
                await this.rollbackConfigUpdate(affectedServices, tempConfigName, currentName);
            }
            throw new Error(`Failed to update config: ${(error as Error).message}`);
        }
    }

    // Helper method to cleanup temporary config
    private async cleanupTempConfig(tempConfigName: string): Promise<void> {
        try {
            const tempConfigs = await docker.listConfigs({ filters: { name: [tempConfigName] } });
            if (tempConfigs.length > 0) {
                const tempConfig = docker.getConfig(tempConfigs[0].ID);
                await tempConfig.remove();
            }
        } catch (error) {
            // Log but don't fail on cleanup errors
            console.warn(`Warning: Failed to cleanup temporary config ${tempConfigName}:`, error);
        }
    }

    // Helper method to rollback config update
    private async rollbackConfigUpdate(affectedServices: any[], tempConfigName: string, originalConfigName: string): Promise<void> {
        try {
            // Try to rollback services to use the temporary config (which has original data)
            for (const service of affectedServices) {
                try {
                    await this.updateServiceConfig(service, originalConfigName, tempConfigName);
                } catch (rollbackError) {
                    console.error(`Failed to rollback service ${service.ID}:`, rollbackError);
                }
            }
        } catch (error) {
            console.error('Rollback failed:', error);
        }
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

    // Helper method to find services using a specific config
    private async findServicesUsingConfig(configId: string): Promise<any[]> {
        try {
            const services = await docker.listServices();
            const affectedServices = [];

            for (const service of services) {
                const serviceSpec = service.Spec;
                const taskTemplate = serviceSpec?.TaskTemplate;

                // Check if TaskTemplate has ContainerSpec (not PluginSpec)
                if (taskTemplate && 'ContainerSpec' in taskTemplate && taskTemplate.ContainerSpec?.Configs) {
                    const usesConfig = taskTemplate.ContainerSpec.Configs.some(
                        (config: any) => config.ConfigID === configId
                    );
                    if (usesConfig) {
                        affectedServices.push(service);
                    }
                }
            }

            return affectedServices;
        } catch (error) {
            throw new Error(`Failed to find services using config: ${(error as Error).message}`);
        }
    }

    // Helper method to update a service's config reference
    private async updateServiceConfig(service: any, oldConfigName: string, newConfigName: string): Promise<void> {
        try {
            const serviceSpec = { ...service.Spec };
            const taskTemplate = serviceSpec.TaskTemplate;

            if (taskTemplate && 'ContainerSpec' in taskTemplate && taskTemplate.ContainerSpec?.Configs) {
                // Find and update the config reference
                taskTemplate.ContainerSpec.Configs = taskTemplate.ContainerSpec.Configs.map((config: any) => {
                    if (config.ConfigName === oldConfigName) {
                        return {
                            ...config,
                            ConfigName: newConfigName
                        };
                    }
                    return config;
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
            throw new Error(`Failed to update service config reference: ${(error as Error).message}`);
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

export default ConfigsController;
