import Docker from 'dockerode';

// Docker client helper (non-TLS)
function createDockerClient(): Docker {
    const dockerHost = process.env.DOCKER_HOST;

    // Parse the host and port from the Docker host URL
    let host: string;
    let port: number;

    if (dockerHost.startsWith('tcp://')) {
        const hostPort = dockerHost.replace('tcp://', '');
        const [hostPart, portPart] = hostPort.split(':');
        host = hostPart || 'localhost';
        port = parseInt(portPart, 10) || 2375;
    } else {
        host = 'localhost';
        port = 2375;
    }

    // Use non-TLS connection to Docker daemon
    const dockerOptions: any = {
        host,
        port,
        protocol: 'http'
    };

    return new Docker(dockerOptions);
}

export { createDockerClient };
