#!/usr/bin/env bash
set -euo pipefail

REGION=${AWS_REGION:?}
ACCOUNT_ID=${AWS_ACCOUNT_ID:?}
REPO=${ECR_REPOSITORY:?}
IMAGE_TAG=${IMAGE_TAG:-}
IMAGE_URI=${IMAGE_URI:-}
CLUSTER_NAME=${ECS_CLUSTER_NAME:-hirondelle-cluster}
SERVICE_NAME=${ECS_SERVICE_NAME:?}
TARGET_PORT=${TARGET_PORT:-8080}
CPU=${CPU:-512}
MEMORY=${MEMORY:-1024}

if [ -z "$IMAGE_URI" ]; then
  if [ -z "$IMAGE_TAG" ]; then
    echo "Either IMAGE_URI or IMAGE_TAG must be provided" >&2
    exit 1
  fi
  IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:${IMAGE_TAG}"
fi

echo "Using image: $IMAGE_URI"

 # Ensure cluster exists
CLUSTER_STATUS=$(aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" --query "clusters[0].status" --output text 2>/dev/null || true)
if [ -z "$CLUSTER_STATUS" ] || [ "$CLUSTER_STATUS" = "None" ] || [ "$CLUSTER_STATUS" = "null" ]; then
  echo "ECS cluster '$CLUSTER_NAME' not found in region $REGION." >&2
  echo "This pipeline will not create clusters. Please create the cluster manually or set \\`ECS_CLUSTER_NAME\\` to an existing cluster." >&2
  exit 1
else
  echo "ECS cluster $CLUSTER_NAME exists (status: $CLUSTER_STATUS)"
fi

# Find a usable VPC, subnet and security group.
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --region "$REGION" --query "Vpcs[0].VpcId" --output text 2>/dev/null || true)
if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ] || [ "$VPC_ID" = "null" ]; then
  VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --query "Vpcs[0].VpcId" --output text 2>/dev/null || true)
fi

if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ] || [ "$VPC_ID" = "null" ]; then
  echo "No VPC found in $REGION. Please create one or configure a specific subnet/security group." >&2
  exit 1
fi

echo "Using VPC: $VPC_ID"

SUBNETS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC_ID" --region "$REGION" --query "Subnets[].SubnetId" --output text 2>/dev/null || true)
if [ -z "$SUBNETS" ]; then
  echo "No subnets found in VPC $VPC_ID" >&2
  exit 1
fi

# Keep up to 2 subnets for Fargate.
read -r -a SUBNET_ARRAY <<< "$SUBNETS"
SELECTED_SUBNETS=()
for subnet in "${SUBNET_ARRAY[@]}"; do
  if [ -n "$subnet" ]; then
    SELECTED_SUBNETS+=("$subnet")
  fi
done

if [ ${#SELECTED_SUBNETS[@]} -eq 0 ]; then
  echo "No usable subnets found in VPC $VPC_ID" >&2
  exit 1
fi

if [ ${#SELECTED_SUBNETS[@]} -gt 2 ]; then
  SELECTED_SUBNETS=("${SELECTED_SUBNETS[0]}" "${SELECTED_SUBNETS[1]}")
fi

DEFAULT_SG=$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC_ID" --region "$REGION" --query "SecurityGroups[?GroupName=='default'].GroupId" --output text 2>/dev/null || true)
if [ -z "$DEFAULT_SG" ] || [ "$DEFAULT_SG" = "None" ] || [ "$DEFAULT_SG" = "null" ]; then
  DEFAULT_SG=$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC_ID" --region "$REGION" --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || true)
fi

if [ -z "$DEFAULT_SG" ] || [ "$DEFAULT_SG" = "None" ] || [ "$DEFAULT_SG" = "null" ]; then
  echo "No security group found in VPC $VPC_ID" >&2
  exit 1
fi

SUBNET_LIST=$(printf "%s," "${SELECTED_SUBNETS[@]}")
SUBNET_LIST=${SUBNET_LIST%,}

 # Require an existing task execution role.
ROLE_NAME="ecsTaskExecutionRole-hirondelle"
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "IAM role '$ROLE_NAME' not found." >&2
  echo "This pipeline will not create IAM roles. Please create the role and attach the policy 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'." >&2
  echo "Example (admin): aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust.json" >&2
  exit 1
else
  echo "IAM role $ROLE_NAME exists"
fi

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query Role.Arn --output text)

echo "Using subnets: ${SELECTED_SUBNETS[*]} and security group: $DEFAULT_SG"

# Register task definition (family derived from service name)
TASK_FAMILY="${SERVICE_NAME}-task"
TASK_DEF_JSON=$(python3 - "$TASK_FAMILY" "$IMAGE_URI" "$ROLE_ARN" "$TARGET_PORT" "$CPU" "$MEMORY" <<'PY'
import json
import sys
family = sys.argv[1]
image = sys.argv[2]
role_arn = sys.argv[3]
port = int(sys.argv[4])
cpu = sys.argv[5]
memory = sys.argv[6]

env_vars = [
    ("MONGODB_URI", "MONGODB_URI"),
    ("COGNITO_USER_POOL_ID", "COGNITO_USER_POOL_ID"),
    ("COGNITO_CLIENT_ID", "COGNITO_CLIENT_ID"),
    ("COGNITO_REGION", "COGNITO_REGION"),
]

environment = []
for env_name, key in env_vars:
    value = __import__('os').environ.get(key, "")
    environment.append({"name": env_name, "value": value})

payload = {
    "family": family,
    "requiresCompatibilities": ["FARGATE"],
    "networkMode": "awsvpc",
    "cpu": cpu,
    "memory": memory,
    "executionRoleArn": role_arn,
    "containerDefinitions": [
        {
            "name": family.replace("-task", ""),
            "image": image,
            "essential": True,
            "portMappings": [{"containerPort": port, "protocol": "tcp"}],
            "environment": environment,
        }
    ],
}
print(json.dumps(payload))
PY
)

echo "Registering task definition $TASK_FAMILY"
aws ecs register-task-definition --cli-input-json "$TASK_DEF_JSON" --region "$REGION" >/dev/null

TASK_DEF_ARN=$(aws ecs describe-task-definition --task-definition "$TASK_FAMILY" --region "$REGION" --query "taskDefinition.taskDefinitionArn" --output text)

echo "Using task definition: $TASK_DEF_ARN"

# Create or update service.
SERVICE_STATUS=$(aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$REGION" --query "services[0].status" --output text 2>/dev/null || true)
if [ -z "$SERVICE_STATUS" ] || [ "$SERVICE_STATUS" = "None" ] || [ "$SERVICE_STATUS" = "null" ]; then
  echo "Creating service $SERVICE_NAME"
  aws ecs create-service \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --task-definition "$TASK_DEF_ARN" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_LIST}],securityGroups=[${DEFAULT_SG}],assignPublicIp=ENABLED}" \
    --region "$REGION" >/dev/null
else
  echo "Updating service $SERVICE_NAME"
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$SERVICE_NAME" \
    --task-definition "$TASK_DEF_ARN" \
    --region "$REGION" >/dev/null
fi

echo "Deployment requested. Waiting for ECS service to become stable..."
aws ecs wait services-stable --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" --region "$REGION"

echo "Deployment complete. Check status with: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
