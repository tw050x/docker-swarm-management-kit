export interface SwarmNode {
    id: string;
    hostname: string;
    status: 'active' | 'inactive' | 'pending';
    role: 'manager' | 'worker';
}

export interface CloudProviderConfig {
    provider: 'aws' | 'azure' | 'gcp';
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export interface SwarmConfig {
    nodeCount: number;
    network: string;
    secrets: string[];
}