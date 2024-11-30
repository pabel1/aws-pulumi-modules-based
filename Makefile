.PHONY: all login init plan up destroy ssh-key

# AWS and Pulumi Configuration
AWS_PROFILE := default
PULUMI_STACK := dev-stack
SSH_KEY_NAME := my-aws-key

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

all: login init up

login:
	@echo "${YELLOW}Configuring AWS and Pulumi${RESET}"
	aws configure --profile $(AWS_PROFILE)
	pulumi login

init:
	@echo "${YELLOW}Initializing or selecting Pulumi stack${RESET}"
	pulumi stack select $(PULUMI_STACK) || pulumi stack init $(PULUMI_STACK)
	pulumi stack select $(PULUMI_STACK)

plan:
	@echo "${YELLOW}Planning Pulumi infrastructure changes${RESET}"
	pulumi preview

up:
	@echo "${YELLOW}Applying Pulumi infrastructure${RESET}"
	pulumi up -y

destroy:
	@echo "${YELLOW}Destroying Pulumi infrastructure${RESET}"
	pulumi destroy -y

ssh-key:
	@echo "${YELLOW}Creating SSH Key Pair${RESET}"
	aws ec2 create-key-pair --profile $(AWS_PROFILE) --key-name $(SSH_KEY_NAME) --query 'KeyMaterial' --output text > $(SSH_KEY_NAME).pem
	chmod 400 $(SSH_KEY_NAME).pem

ssh-bastion:
	@echo "${YELLOW}SSH into Bastion Host${RESET}"
	ssh -i $(SSH_KEY_NAME).pem ec2-user@<BASTION_PUBLIC_IP>

# Additional targets can be added for specific operations