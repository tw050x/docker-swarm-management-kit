// Docker Swarm Management Kit - Web Application
// Main JavaScript application for managing secrets and configs

class DockerSwarmApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.secrets = [];
        this.configs = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setupModalHandlers();
        this.setupFormHandlers();

        // Load initial data
        await this.loadDashboardData();

        console.log('Docker Swarm Management Kit initialized');
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.closest('.nav-btn').dataset.tab;
                this.switchTab(tab);
            });
        });

        // Modal close handlers
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupTabNavigation() {
        // Make switchTab available globally
        window.switchTab = (tabName) => this.switchTab(tabName);
    }

    setupModalHandlers() {
        // Make modal functions available globally
        window.showCreateSecretModal = () => this.showCreateSecretModal();
        window.showCreateConfigModal = () => this.showCreateConfigModal();
        window.showEditSecretModal = (id, name, data) => this.showEditSecretModal(id, name, data);
        window.showEditConfigModal = (id, name, data) => this.showEditConfigModal(id, name, data);
        window.closeModal = (modalId) => this.closeModal(modalId);

        // Make CRUD functions available globally
        window.loadSecrets = () => this.loadSecrets();
        window.loadConfigs = () => this.loadConfigs();
        window.deleteSecret = (id) => this.deleteSecret(id);
        window.deleteConfig = (id) => this.deleteConfig(id);
    }

    setupFormHandlers() {
        // Create Secret Form
        document.getElementById('create-secret-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createSecret();
        });

        // Create Config Form
        document.getElementById('create-config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createConfig();
        });

        // Edit Secret Form
        document.getElementById('edit-secret-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateSecret();
        });

        // Edit Config Form
        document.getElementById('edit-config-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateConfig();
        });
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load data for the active tab
        if (tabName === 'secrets') {
            this.loadSecrets();
        } else if (tabName === 'configs') {
            this.loadConfigs();
        } else if (tabName === 'dashboard') {
            this.loadDashboardData();
        }
    }

    async loadDashboardData() {
        try {
            const [secretsResponse, configsResponse] = await Promise.all([
                fetch('/api/secrets'),
                fetch('/api/configs')
            ]);

            if (secretsResponse.ok) {
                const secrets = await secretsResponse.json();
                document.getElementById('secrets-count').textContent = secrets.length;
            }

            if (configsResponse.ok) {
                const configs = await configsResponse.json();
                document.getElementById('configs-count').textContent = configs.length;
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('secrets-count').textContent = 'Error';
            document.getElementById('configs-count').textContent = 'Error';
        }
    }

    async loadSecrets() {
        const tbody = document.getElementById('secrets-tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="loading"><div class="loading-spinner"></div> Loading secrets...</td></tr>';

        try {
            const response = await fetch('/api/secrets');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.secrets = await response.json();
            this.renderSecretsTable();
        } catch (error) {
            console.error('Error loading secrets:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="error">Error loading secrets: ' + error.message + '</td></tr>';
            this.showMessage('Error loading secrets: ' + error.message, 'error');
        }
    }

    async loadConfigs() {
        const tbody = document.getElementById('configs-tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="loading"><div class="loading-spinner"></div> Loading configs...</td></tr>';

        try {
            const response = await fetch('/api/configs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.configs = await response.json();
            this.renderConfigsTable();
        } catch (error) {
            console.error('Error loading configs:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="error">Error loading configs: ' + error.message + '</td></tr>';
            this.showMessage('Error loading configs: ' + error.message, 'error');
        }
    }

    renderSecretsTable() {
        const tbody = document.getElementById('secrets-tbody');

        if (this.secrets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty">No secrets found. Create your first secret!</td></tr>';
            return;
        }

        tbody.innerHTML = this.secrets.map(secret => `
            <tr>
                <td><strong>${this.escapeHtml(secret.Spec?.Name || 'Unknown')}</strong></td>
                <td><code>${this.escapeHtml(secret.ID?.substring(0, 12) || 'Unknown')}</code></td>
                <td>${this.formatDate(secret.CreatedAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" onclick="showEditSecretModal('${secret.ID}', '${this.escapeHtml(secret.Spec?.Name || '')}', '')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSecret('${secret.ID}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderConfigsTable() {
        const tbody = document.getElementById('configs-tbody');

        if (this.configs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty">No configs found. Create your first config!</td></tr>';
            return;
        }

        tbody.innerHTML = this.configs.map(config => `
            <tr>
                <td><strong>${this.escapeHtml(config.Spec?.Name || 'Unknown')}</strong></td>
                <td><code>${this.escapeHtml(config.ID?.substring(0, 12) || 'Unknown')}</code></td>
                <td>${this.formatDate(config.CreatedAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" onclick="showEditConfigModal('${config.ID}', '${this.escapeHtml(config.Spec?.Name || '')}', '${this.escapeHtml(config.Spec?.Data ? atob(config.Spec.Data) : '')}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteConfig('${config.ID}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Modal Management
    showCreateSecretModal() {
        document.getElementById('create-secret-form').reset();
        this.showModal('create-secret-modal');
    }

    showCreateConfigModal() {
        document.getElementById('create-config-form').reset();
        this.showModal('create-config-modal');
    }

    showEditSecretModal(id, name, data) {
        document.getElementById('edit-secret-id').value = id;
        document.getElementById('edit-secret-name').value = name;
        document.getElementById('edit-secret-data').value = data;
        this.showModal('edit-secret-modal');
    }

    showEditConfigModal(id, name, data) {
        document.getElementById('edit-config-id').value = id;
        document.getElementById('edit-config-name').value = name;
        document.getElementById('edit-config-data').value = data;
        this.showModal('edit-config-modal');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    // CRUD Operations
    async createSecret() {
        const form = document.getElementById('create-secret-form');
        const formData = new FormData(form);

        const secretData = {
            name: formData.get('name'),
            data: formData.get('data')
        };

        try {
            const response = await fetch('/api/secrets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(secretData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create secret');
            }

            this.showMessage('Secret created successfully!', 'success');
            this.closeModal('create-secret-modal');

            if (this.currentTab === 'secrets') {
                await this.loadSecrets();
            }
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error creating secret:', error);
            this.showMessage('Error creating secret: ' + error.message, 'error');
        }
    }

    async createConfig() {
        const form = document.getElementById('create-config-form');
        const formData = new FormData(form);

        const configData = {
            name: formData.get('name'),
            data: formData.get('data')
        };

        try {
            const response = await fetch('/api/configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create config');
            }

            this.showMessage('Config created successfully!', 'success');
            this.closeModal('create-config-modal');

            if (this.currentTab === 'configs') {
                await this.loadConfigs();
            }
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error creating config:', error);
            this.showMessage('Error creating config: ' + error.message, 'error');
        }
    }

    async updateSecret() {
        const form = document.getElementById('edit-secret-form');
        const formData = new FormData(form);
        const id = document.getElementById('edit-secret-id').value;

        const secretData = {
            name: formData.get('name'),
            data: formData.get('data')
        };

        try {
            const response = await fetch(`/api/secrets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(secretData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update secret');
            }

            this.showMessage('Secret updated successfully!', 'success');
            this.closeModal('edit-secret-modal');

            if (this.currentTab === 'secrets') {
                await this.loadSecrets();
            }
        } catch (error) {
            console.error('Error updating secret:', error);
            this.showMessage('Error updating secret: ' + error.message, 'error');
        }
    }

    async updateConfig() {
        const form = document.getElementById('edit-config-form');
        const formData = new FormData(form);
        const id = document.getElementById('edit-config-id').value;

        const configData = {
            name: formData.get('name'),
            data: formData.get('data')
        };

        try {
            const response = await fetch(`/api/configs/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update config');
            }

            this.showMessage('Config updated successfully!', 'success');
            this.closeModal('edit-config-modal');

            if (this.currentTab === 'configs') {
                await this.loadConfigs();
            }
        } catch (error) {
            console.error('Error updating config:', error);
            this.showMessage('Error updating config: ' + error.message, 'error');
        }
    }

    async deleteSecret(id) {
        if (!confirm('Are you sure you want to delete this secret? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/secrets/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete secret');
            }

            this.showMessage('Secret deleted successfully!', 'success');

            if (this.currentTab === 'secrets') {
                await this.loadSecrets();
            }
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error deleting secret:', error);
            this.showMessage('Error deleting secret: ' + error.message, 'error');
        }
    }

    async deleteConfig(id) {
        if (!confirm('Are you sure you want to delete this config? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/configs/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete config');
            }

            this.showMessage('Config deleted successfully!', 'success');

            if (this.currentTab === 'configs') {
                await this.loadConfigs();
            }
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error deleting config:', error);
            this.showMessage('Error deleting config: ' + error.message, 'error');
        }
    }

    // Utility Methods
    showMessage(message, type = 'success') {
        const container = document.getElementById('message-container');
        const messageDiv = document.createElement('div');

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';

        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${this.escapeHtml(message)}</span>
        `;

        container.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';

        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (error) {
            return 'Invalid date';
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dockerSwarmApp = new DockerSwarmApp();
});

// Export for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DockerSwarmApp;
}
