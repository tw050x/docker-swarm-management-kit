export class CloudProvider {
    constructor(public name: string, public region: string) {}

    createNode(instanceType: string): void {
        // Logic to create a cloud node
        console.log(`Creating a ${instanceType} node in ${this.region} on ${this.name}`);
    }

    deleteNode(nodeId: string): void {
        // Logic to delete a cloud node
        console.log(`Deleting node ${nodeId} from ${this.name}`);
    }

    listNodes(): void {
        // Logic to list all nodes in the cloud provider
        console.log(`Listing nodes for ${this.name} in ${this.region}`);
    }
}