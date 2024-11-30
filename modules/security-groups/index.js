const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

class SecurityGroupModule {
  constructor(config, vpcId) {
    this.config = config;
    this.vpcId = vpcId;
  }

  createSecurityGroups() {
    const bastionSg = this._createBastionSecurityGroup();
    const frontendSg = this._createFrontendSecurityGroup();
    const backendSg = this._createBackendSecurityGroup(frontendSg);
    const databaseSg = this._createDatabaseSecurityGroup(backendSg);

    return {
      bastionSg,
      frontendSg,
      backendSg,
      databaseSg,
    };
  }

  _createBastionSecurityGroup() {
    return new aws.ec2.SecurityGroup("bastion-sg", {
      vpcId: this.vpcId,
      description: "Security group for bastion host",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: [this.config.security.sshSourceIp],
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...this.config.tags,
        Name: "bastion-sg",
      },
    });
  }

  _createFrontendSecurityGroup() {
    return new aws.ec2.SecurityGroup("frontend-sg", {
      vpcId: this.vpcId,
      description: "Security group for frontend instances",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...this.config.tags,
        Name: "frontend-sg",
      },
    });
  }

  _createBackendSecurityGroup(frontendSg) {
    return new aws.ec2.SecurityGroup("backend-sg", {
      vpcId: this.vpcId,
      description: "Security group for backend instances",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 4000,
          toPort: 4000,
          securityGroupIds: [frontendSg.id],
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...this.config.tags,
        Name: "backend-sg",
      },
    });
  }

  _createDatabaseSecurityGroup(backendSg) {
    return new aws.ec2.SecurityGroup("database-sg", {
      vpcId: this.vpcId,
      description: "Security group for database instances",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 27017,
          toPort: 27017,
          securityGroupIds: [backendSg.id],
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        ...this.config.tags,
        Name: "database-sg",
      },
    });
  }
}

module.exports = SecurityGroupModule;
