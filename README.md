# Docker Swarm Management Kit

The Docker Swarm Management Kit is a comprehensive solution for managing Docker Swarm configurations and secrets through a user-friendly interface. This project consists of two main components: a web application and an Electron application.

## Features

- **Web-based UI** for managing Docker Swarm secrets and configurations
- **Simplified Docker communication** for ease of development
- **Local development setup** with Docker-in-Docker (DinD)
- **Cross-platform Electron app** (planned) for swarm node management

## Quick Start

1. **Prerequisites**
   - Docker Desktop installed and running
   - Docker Compose available

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the web interface**
   - Open your browser to http://localhost:3000
   - The application will automatically set up a local Docker Swarm

## Development

This project is configured for easy local development:
- Docker-in-Docker (DinD) setup for local swarm testing
- Non-TLS Docker communication for simplified development
- Automatic test data population for development

## Project Structure

```
docker-swarm-management-kit
├── web-app                # Web application for managing Docker Swarm
│   ├── src                # Source code for the web application
│   ├── public             # Public assets for the web application
│   ├── Dockerfile         # Dockerfile for building the web application image
│   ├── package.json       # npm configuration for the web application
│   └── tsconfig.json      # TypeScript configuration for the web application
├── electron-app           # Electron application for managing swarm nodes
│   ├── src                # Source code for the Electron application
│   ├── public             # Public assets for the Electron application
│   ├── package.json       # npm configuration for the Electron application
│   └── tsconfig.json      # TypeScript configuration for the Electron application
├── .github                # GitHub workflows for CI/CD
│   └── workflows          # Workflow definitions
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # Project documentation
```

## Features

- **Web Application**: A web-based UI for managing Docker Swarm configurations and secrets. Users can easily interact with the Docker API to manage their swarm setup.

- **Electron Application**: A desktop application that allows users to create swarm nodes and manage the cluster across various cloud providers. It provides a seamless experience for setting up and managing Docker Swarm clusters.

## Getting Started

To get started with the Docker Swarm Management Kit, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/docker-swarm-management-kit.git
   cd docker-swarm-management-kit
   ```

2. Build the web application:
   ```
   cd web-app
   docker build -t docker-swarm-web-app .
   ```

3. Run the application using Docker Compose:
   ```
   docker-compose up
   ```

4. For the Electron application, navigate to the `electron-app` directory and install dependencies:
   ```
   cd electron-app
   npm install
   ```

5. Start the Electron application:
   ```
   npm start
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
