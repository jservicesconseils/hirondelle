#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Configuration
# ============================================================

REGION="${AWS_REGION:?AWS_REGION is required}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
REPO="${ECR_REPOSITORY:?ECR_REPOSITORY is required}"

IMAGE_TAG="${IMAGE_TAG:-}"
IMAGE_URI="${IMAGE_URI:-}"

CLUSTER_NAME="${ECS_CLUSTER_NAME:-cluster_hirondelle}"
SERVICE_NAME="${ECS_SERVICE_NAME:?ECS_SERVICE_NAME is required}"

TARGET_PORT="${TARGET_PORT:-8080}"
CPU="${CPU:-512}"
MEMORY="${MEMORY:-1024}"

# Existing Hirondelle VPC
VPC_ID="${VPC_ID:-vpc-05ffbeb90d67b70ac}"

# Public subnet names created in the Hirondelle VPC
PUBLIC_SUBNET_1_NAME="${PUBLIC_SUBNET_1_NAME:-hirondelle-vpc-subnet-public1-us-east-1a}"
PUBLIC_SUBNET_2_NAME="${PUBLIC_SUBNET_2_NAME:-hirondelle-vpc-subnet-public2-us-east-1b}"

# Existing ECS task execution role
ROLE_NAME="${ECS_TASK_EXECUTION_ROLE_NAME:-ecsTaskExecutionRole}"


# ============================================================
# Build image URI if not provided
# ============================================================

if [ -z "$IMAGE_URI" ]; then

  if [ -z "$IMAGE_TAG" ]; then
    echo "Either IMAGE_URI or IMAGE_TAG must be provided" >&2
    exit 1
  fi

  IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:${IMAGE_TAG}"

fi

echo "========================================"
echo "ECS DEPLOYMENT"
echo "========================================"
echo "Region       : $REGION"
echo "Account      : $ACCOUNT_ID"
echo "Repository   : $REPO"
echo "Image        : $IMAGE_URI"
echo "Cluster      : $CLUSTER_NAME"
echo "Service      : $SERVICE_NAME"
echo "VPC          : $VPC_ID"
echo "Container port: $TARGET_PORT"
echo "========================================"


# ============================================================
# 1. Verify ECS cluster
# ============================================================

echo ""
echo "Checking ECS cluster..."

CLUSTER_STATUS=$(
  aws ecs describe-clusters \
    --clusters "$CLUSTER_NAME" \
    --region "$REGION" \
    --query "clusters[0].status" \
    --output text 2>/dev/null || true
)

if [ -z "$CLUSTER_STATUS" ] ||
   [ "$CLUSTER_STATUS" = "None" ] ||
   [ "$CLUSTER_STATUS" = "null" ]; then

  echo "ERROR: ECS cluster '$CLUSTER_NAME' not found in region $REGION." >&2
  exit 1
fi

echo "ECS cluster '$CLUSTER_NAME' exists."
echo "Status: $CLUSTER_STATUS"


# ============================================================
# 2. Verify VPC
# ============================================================

echo ""
echo "Checking VPC..."

VPC_STATE=$(
  aws ec2 describe-vpcs \
    --vpc-ids "$VPC_ID" \
    --region "$REGION" \
    --query "Vpcs[0].State" \
    --output text 2>/dev/null || true
)

if [ -z "$VPC_STATE" ] ||
   [ "$VPC_STATE" = "None" ] ||
   [ "$VPC_STATE" = "null" ]; then

  echo "ERROR: VPC '$VPC_ID' not found in region $REGION." >&2
  exit 1
fi

echo "VPC exists."
echo "VPC ID: $VPC_ID"
echo "State: $VPC_STATE"


# ============================================================
# 3. Find PUBLIC subnet 1
# ============================================================

echo ""
echo "Finding public subnet 1..."

SUBNET_1=$(
  aws ec2 describe-subnets \
    --filters \
      "Name=vpc-id,Values=$VPC_ID" \
      "Name=tag:Name,Values=$PUBLIC_SUBNET_1_NAME" \
    --region "$REGION" \
    --query "Subnets[0].SubnetId" \
    --output text 2>/dev/null || true
)

if [ -z "$SUBNET_1" ] ||
   [ "$SUBNET_1" = "None" ] ||
   [ "$SUBNET_1" = "null" ]; then

  echo "ERROR: Public subnet '$PUBLIC_SUBNET_1_NAME' not found." >&2
  exit 1
fi

echo "Public subnet 1: $SUBNET_1"


# ============================================================
# 4. Find PUBLIC subnet 2
# ============================================================

echo ""
echo "Finding public subnet 2..."

SUBNET_2=$(
  aws ec2 describe-subnets \
    --filters \
      "Name=vpc-id,Values=$VPC_ID" \
      "Name=tag:Name,Values=$PUBLIC_SUBNET_2_NAME" \
    --region "$REGION" \
    --query "Subnets[0].SubnetId" \
    --output text 2>/dev/null || true
)

if [ -z "$SUBNET_2" ] ||
   [ "$SUBNET_2" = "None" ] ||
   [ "$SUBNET_2" = "null" ]; then

  echo "ERROR: Public subnet '$PUBLIC_SUBNET_2_NAME' not found." >&2
  exit 1
fi

echo "Public subnet 2: $SUBNET_2"


# ============================================================
# 5. Find default Security Group in VPC
# ============================================================

echo ""
echo "Finding Security Group..."

SECURITY_GROUP_ID=$(
  aws ec2 describe-security-groups \
    --filters \
      "Name=vpc-id,Values=$VPC_ID" \
      "Name=group-name,Values=default" \
    --region "$REGION" \
    --query "SecurityGroups[0].GroupId" \
    --output text 2>/dev/null || true
)

if [ -z "$SECURITY_GROUP_ID" ] ||
   [ "$SECURITY_GROUP_ID" = "None" ] ||
   [ "$SECURITY_GROUP_ID" = "null" ]; then

  echo "ERROR: Default Security Group not found in VPC $VPC_ID." >&2
  exit 1
fi

echo "Security Group: $SECURITY_GROUP_ID"


# ============================================================
# 6. Verify ECS Task Execution Role
# ============================================================

echo ""
echo "Checking ECS Task Execution Role..."

if ! aws iam get-role \
  --role-name "$ROLE_NAME" \
  >/dev/null 2>&1; then

  echo "ERROR: IAM role '$ROLE_NAME' not found." >&2

  echo ""
  echo "Create the role manually and attach:"
  echo "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

  exit 1
fi

ROLE_ARN=$(
  aws iam get-role \
    --role-name "$ROLE_NAME" \
    --query "Role.Arn" \
    --output text
)

echo "Task Execution Role:"
echo "$ROLE_ARN"


# ============================================================
# 7. Register ECS Task Definition
# ============================================================

TASK_FAMILY="${SERVICE_NAME}-task"

echo ""
echo "Creating task definition: $TASK_FAMILY"


TASK_DEF_JSON=$(
python3 - \
  "$TASK_FAMILY" \
  "$IMAGE_URI" \
  "$ROLE_ARN" \
  "$TARGET_PORT" \
  "$CPU" \
  "$MEMORY" <<'PY'

import json
import os
import sys

family = sys.argv[1]
image = sys.argv[2]
role_arn = sys.argv[3]
port = int(sys.argv[4])
cpu = sys.argv[5]
memory = sys.argv[6]

environment = []

for name in [
    "MONGODB_URI",
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID",
    "COGNITO_REGION"
]:

    value = os.environ.get(name, "")

    if value:
        environment.append({
            "name": name,
            "value": value
        })


container_name = family.replace("-task", "")

payload = {
    "family": family,

    "requiresCompatibilities": [
        "FARGATE"
    ],

    "networkMode": "awsvpc",

    "cpu": cpu,

    "memory": memory,

    "executionRoleArn": role_arn,

    "containerDefinitions": [
        {
            "name": container_name,

            "image": image,

            "essential": True,

            "portMappings": [
                {
                    "containerPort": port,
                    "hostPort": port,
                    "protocol": "tcp"
                }
            ],

            "environment": environment
        }
    ]
}

print(json.dumps(payload))

PY
)


echo "Registering task definition..."

aws ecs register-task-definition \
  --cli-input-json "$TASK_DEF_JSON" \
  --region "$REGION" \
  >/dev/null


TASK_DEF_ARN=$(
  aws ecs describe-task-definition \
    --task-definition "$TASK_FAMILY" \
    --region "$REGION" \
    --query "taskDefinition.taskDefinitionArn" \
    --output text
)

echo "Task definition:"
echo "$TASK_DEF_ARN"


# ============================================================
# 8. Create or update ECS service
# ============================================================

echo ""
echo "Checking ECS service..."

SERVICE_STATUS=$(
  aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$REGION" \
    --query "services[0].status" \
    --output text 2>/dev/null || true
)


# ============================================================
# 9. Create service
# ============================================================

if [ -z "$SERVICE_STATUS" ] ||
   [ "$SERVICE_STATUS" = "None" ] ||
   [ "$SERVICE_STATUS" = "null" ]; then

  echo ""
  echo "Creating ECS service: $SERVICE_NAME"

  aws ecs create-service \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --task-definition "$TASK_DEF_ARN" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration \
      "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --region "$REGION" \
    >/dev/null

else

  # ==========================================================
  # 10. Update existing service
  # ==========================================================

  echo ""
  echo "Updating ECS service: $SERVICE_NAME"

  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$SERVICE_NAME" \
    --task-definition "$TASK_DEF_ARN" \
    --region "$REGION" \
    >/dev/null

fi


# ============================================================
# 11. Wait for service stability
# ============================================================

echo ""
echo "Waiting for ECS service to become stable..."

aws ecs wait services-stable \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION"


# ============================================================
# 12. Final status
# ============================================================

echo ""
echo "========================================"
echo "ECS DEPLOYMENT COMPLETE"
echo "========================================"

aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION" \
  --query "services[0].{Service:serviceName,Status:status,Running:runningCount,Desired:desiredCount,TaskDefinition:taskDefinition}" \
  --output table

echo ""
echo "Deployment complete."