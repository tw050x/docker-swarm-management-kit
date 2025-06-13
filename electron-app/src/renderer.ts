import { ipcRenderer } from 'electron';
import { SwarmManager } from './components/SwarmManager';
import { CloudProvider } from './components/CloudProvider';

// Initialize Swarm Manager
const swarmManager = new SwarmManager();

// Initialize Cloud Provider
const cloudProvider = new CloudProvider();

// Function to create a new swarm node
const createSwarmNode = async (nodeConfig) => {
    try {
        const result = await swarmManager.createNode(nodeConfig);
        console.log('Swarm node created:', result);
    } catch (error) {
        console.error('Error creating swarm node:', error);
    }
};

// Function to add a node to the cluster
const addNodeToCluster = async (nodeId) => {
    try {
        const result = await swarmManager.addNode(nodeId);
        console.log('Node added to cluster:', result);
    } catch (error) {
        console.error('Error adding node to cluster:', error);
    }
};

// Function to handle cloud provider interactions
const handleCloudProvider = async (providerConfig) => {
    try {
        const result = await cloudProvider.setupProvider(providerConfig);
        console.log('Cloud provider setup:', result);
    } catch (error) {
        console.error('Error setting up cloud provider:', error);
    }
};

// IPC event listeners
ipcRenderer.on('create-swarm-node', (event, nodeConfig) => {
    createSwarmNode(nodeConfig);
});

ipcRenderer.on('add-node-to-cluster', (event, nodeId) => {
    addNodeToCluster(nodeId);
});

ipcRenderer.on('setup-cloud-provider', (event, providerConfig) => {
    handleCloudProvider(providerConfig);
});