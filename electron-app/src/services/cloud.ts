import { CloudProvider } from '../components/CloudProvider';

export class CloudService {
    private cloudProvider: CloudProvider;

    constructor() {
        this.cloudProvider = new CloudProvider();
    }

    public async createSwarmNode(provider: string, nodeName: string, options: any): Promise<void> {
        try {
            await this.cloudProvider.createNode(provider, nodeName, options);
        } catch (error) {
            console.error('Error creating swarm node:', error);
            throw error;
        }
    }

    public async listSwarmNodes(provider: string): Promise<any[]> {
        try {
            return await this.cloudProvider.listNodes(provider);
        } catch (error) {
            console.error('Error listing swarm nodes:', error);
            throw error;
        }
    }

    public async deleteSwarmNode(provider: string, nodeId: string): Promise<void> {
        try {
            await this.cloudProvider.deleteNode(provider, nodeId);
        } catch (error) {
            console.error('Error deleting swarm node:', error);
            throw error;
        }
    }
}