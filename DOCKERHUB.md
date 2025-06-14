# Docker Swarm Management Kit

A comprehensive solution for managing Docker Swarm clusters with both web-based and desktop interfaces.

## 🏃 Quick Start

Deploy the web UI to your Docker Swarm cluster:

```bash
docker service create \
  --name swarm-operations-manager \
  --publish 8080:8080 \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  --constraint 'node.role == manager' \
  tw050x/docker-swarm-operations-manager:latest
```

Access the web interface at `http://your-swarm-manager:8080`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Web UI port | `8080` |
| `DOCKER_HOST` | Docker host URL |  |

### Volume Mounts

```bash
# Required: Docker socket access
--mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock
```

## 📄 License

MIT License - see the [LICENSE](https://github.com/richardkielty/docker-swarm-management-kit/blob/main/LICENSE) file for details.
