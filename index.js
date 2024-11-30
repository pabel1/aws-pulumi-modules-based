const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Import custom modules
const config = require("./config");
const VpcModule = require("./modules/vpc");
const SecurityGroupModule = require("./modules/security-groups");

class InfrastructureStack {
  constructor() {
    this.config = config;
    this.setupInfrastructure();
  }

  setupInfrastructure() {
    // Create VPC
    const vpcModule = new VpcModule(this.config);
    const { vpc, publicSubnets, privateSubnets } = vpcModule.createVpc();

    // Create Security Groups
    const securityGroupModule = new SecurityGroupModule(this.config, vpc.id);
    const securityGroups = securityGroupModule.createSecurityGroups();

    // Exports
    this.exports = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map((subnet) => subnet.id),
      privateSubnetIds: privateSubnets.map((subnet) => subnet.id),
      securityGroups,
    };
  }
}

module.exports = new InfrastructureStack();
