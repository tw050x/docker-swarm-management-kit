export interface SwarmConfig {
    id: string;
    name: string;
    nodeCount: number;
    createdAt: Date;
}

export interface Secret {
    id: string;
    name: string;
    value: string;
    createdAt: Date;
}

export interface Node {
    id: string;
    hostname: string;
    status: string;
    role: 'manager' | 'worker';
}

export interface CloudProvider {
    id: string;
    name: string;
    region: string;
    accessKey: string;
    secretKey: string;
}