module.exports = {
  project: {
    name: "MyWebApp",
    environment: "Production",
  },

  tags: {
    ManagedBy: "Pulumi",
    Environment: "Production",
    Project: "MyWebApp",
  },

  vpc: {
    cidrBlock: "10.0.0.0/16",
    availabilityZones: ["ap-southeast-1a"],
    publicSubnets: ["10.0.1.0/24"],
    privateSubnets: ["10.0.10.0/24"],
  },

  bastion: {
    instanceType: "t2.micro",
    ami: "ami-0c55b159cbfafe1f0",
    sshKeyName: "bastion-ssh-key",
  },

  ec2: {
    frontend: {
      instanceType: "t2.micro",
      ami: "ami-0c55b159cbfafe1f0",
      dockerImage: "username/frontend-repo:latest",
      containerPort: 80,
      hostPort: 80,
    },
    backend: {
      instanceType: "t2.micro",
      ami: "ami-0c55b159cbfafe1f0",
      dockerImage: "username/backend-repo:latest",
      containerPort: 4000,
      hostPort: 4000,
      healthCheckPath: "/health",
    },
    database: {
      instanceType: "t2.micro",
      ami: "ami-0c55b159cbfafe1f0",
      dockerImage: "mongo:latest",
      containerPort: 27017,
      hostPort: 27017,
    },
  },

  security: {
    sshSourceIp: "0.0.0.0/0",
    healthCheckPort: 80,
  },
};
