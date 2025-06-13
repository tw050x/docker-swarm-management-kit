import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const getDockerInfo = async () => {
    try {
        const { stdout } = await execPromise('docker info');
        return stdout;
    } catch (error) {
        throw new Error(`Failed to get Docker info: ${error.message}`);
    }
};

export const createSwarm = async () => {
    try {
        const { stdout } = await execPromise('docker swarm init');
        return stdout;
    } catch (error) {
        throw new Error(`Failed to create swarm: ${error.message}`);
    }
};

export const joinSwarm = async (token: string, managerIp: string) => {
    try {
        const { stdout } = await execPromise(`docker swarm join --token ${token} ${managerIp}:2377`);
        return stdout;
    } catch (error) {
        throw new Error(`Failed to join swarm: ${error.message}`);
    }
};

export const leaveSwarm = async () => {
    try {
        const { stdout } = await execPromise('docker swarm leave');
        return stdout;
    } catch (error) {
        throw new Error(`Failed to leave swarm: ${error.message}`);
    }
};