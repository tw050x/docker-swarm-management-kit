import React, { useState } from 'react';

class SwarmManager extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            swarmNodes: [],
            joinToken: '',
            error: null,
        };
    }

    componentDidMount() {
        this.fetchSwarmNodes();
    }

    fetchSwarmNodes = async () => {
        try {
            const response = await fetch('/api/swarm/nodes');
            const data = await response.json();
            this.setState({ swarmNodes: data });
        } catch (error) {
            this.setState({ error: 'Failed to fetch swarm nodes' });
        }
    };

    createSwarmNode = async (nodeName) => {
        try {
            const response = await fetch('/api/swarm/nodes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: nodeName }),
            });
            if (response.ok) {
                this.fetchSwarmNodes();
            } else {
                this.setState({ error: 'Failed to create swarm node' });
            }
        } catch (error) {
            this.setState({ error: 'Failed to create swarm node' });
        }
    };

    render() {
        const { swarmNodes, joinToken, error } = this.state;

        return (
            <div>
                <h1>Swarm Manager</h1>
                {error && <p className="error">{error}</p>}
                <ul>
                    {swarmNodes.map((node) => (
                        <li key={node.id}>{node.name}</li>
                    ))}
                </ul>
                <input
                    type="text"
                    placeholder="Node Name"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            this.createSwarmNode(e.target.value);
                            e.target.value = '';
                        }
                    }}
                />
                <p>Join Token: {joinToken}</p>
            </div>
        );
    }
}

export default SwarmManager;