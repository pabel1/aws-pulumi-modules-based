const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

class VpcModule {
  constructor(config) {
    this.config = config;
  }

  createVpc() {
    const vpc = new aws.ec2.Vpc("main-vpc", {
      cidrBlock: this.config.vpc.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...this.config.tags,
        Name: "main-vpc",
      },
    });

    const internetGateway = new aws.ec2.InternetGateway("main-igw", {
      vpcId: vpc.id,
      tags: {
        ...this.config.tags,
        Name: "main-igw",
      },
    });

    const publicSubnets = this._createSubnets(
      vpc,
      this.config.vpc.publicSubnets,
      "public",
      true
    );

    const privateSubnets = this._createSubnets(
      vpc,
      this.config.vpc.privateSubnets,
      "private",
      false
    );

    const publicRouteTable = this._createPublicRouteTable(vpc, internetGateway);

    const natGateways = this._createNatGateways(vpc, publicSubnets);

    const privateRouteTables = this._createPrivateRouteTables(
      vpc,
      natGateways,
      privateSubnets
    );

    return {
      vpc,
      publicSubnets,
      privateSubnets,
      internetGateway,
      publicRouteTable,
      natGateways,
      privateRouteTables,
    };
  }

  _createSubnets(vpc, cidrBlocks, type, mapPublicIp = false) {
    return this.config.vpc.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(`${type}-subnet-${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: cidrBlocks[index],
        availabilityZone: az,
        mapPublicIpOnLaunch: mapPublicIp,
        tags: {
          ...this.config.tags,
          Name: `${type}-subnet-${index + 1}`,
        },
      });
    });
  }

  _createPublicRouteTable(vpc, internetGateway) {
    const publicRouteTable = new aws.ec2.RouteTable("public-rt", {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: internetGateway.id,
        },
      ],
      tags: {
        ...this.config.tags,
        Name: "public-rt",
      },
    });

    return publicRouteTable;
  }

  _createNatGateways(vpc, publicSubnets) {
    return publicSubnets.map((subnet, index) => {
      const natEip = new aws.ec2.Eip(`nat-eip-${index + 1}`, {
        vpc: true,
        tags: {
          ...this.config.tags,
          Name: `nat-eip-${index + 1}`,
        },
      });

      return new aws.ec2.NatGateway(`nat-gateway-${index + 1}`, {
        allocationId: natEip.id,
        subnetId: subnet.id,
        tags: {
          ...this.config.tags,
          Name: `nat-gateway-${index + 1}`,
        },
      });
    });
  }

  _createPrivateRouteTables(vpc, natGateways, privateSubnets) {
    return natGateways.map((natGateway, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${index + 1}`,
        {
          vpcId: vpc.id,
          routes: [
            {
              cidrBlock: "0.0.0.0/0",
              natGatewayId: natGateway.id,
            },
          ],
          tags: {
            ...this.config.tags,
            Name: `private-rt-${index + 1}`,
          },
        }
      );

      new aws.ec2.RouteTableAssociation(`private-rt-association-${index + 1}`, {
        subnetId: privateSubnets[index].id,
        routeTableId: privateRouteTable.id,
      });

      return privateRouteTable;
    });
  }
}

module.exports = VpcModule;
