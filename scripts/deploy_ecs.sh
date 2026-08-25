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

# ARN of the ALB target group to attach on service creation (optional).
# Only used when the service does not exist yet: ECS does not allow
# attaching a load balancer to a service that was created without one.
TARGET_GROUP_ARN="${TARGET_GROUP_ARN:-}"

# Existing Hirondelle VPC
VPC_ID="${VPC_ID:-vpc-05ffbeb90d67b70ac}"

# Public subnet names created in the Hirondelle VPC
PUBLIC_SUBNET_1_NAME="${PUBLIC_SUBNET_1_NAME:-hirondelle-vpc-subnet-public1-us-east-1a}"
PUBLIC_SUBNET_2_NAME="${PUBLIC_SUBNET_2_NAME:-hirondelle-vpc-subnet-public2-us-east-1b}"

# Existing ECS task execution role (pulls the image, ships logs)
ROLE_NAME="${ECS_TASK_EXECUTION_ROLE_NAME:-ecsTaskExecutionRole}"

# ECS task role (the container's own AWS identity at runtime: SNS, Cognito
# admin calls). Created if missing — unlike the execution role above, nothing
# provisions this one outside of this script.
TASK_ROLE_NAME="${ECS_TASK_ROLE_NAME:-hirondelle-backend-task-role}"

# Needed to scope the Cognito admin permissions to this one pool. Optional:
# the policy statement is skipped if unset, matching how the rest of this
# script treats Cognito as optional.
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-}"

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
echo "Target group  : ${TARGET_GROUP_ARN:-<none>}"
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
# 6bis. Ensure ECS Task Role exists (the container's own runtime identity)
# ============================================================

echo ""
echo "Checking ECS Task Role..."

if ! aws iam get-role --role-name "$TASK_ROLE_NAME" >/dev/null 2>&1; then

  echo "Task role '$TASK_ROLE_NAME' not found, creating it..."

  aws iam create-role \
    --role-name "$TASK_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "Service": "ecs-tasks.amazonaws.com" },
          "Action": "sts:AssumeRole"
        }
      ]
    }' \
    >/dev/null

  # A brand-new role can take a few seconds to become usable elsewhere.
  sleep 8
fi

TASK_ROLE_ARN=$(
  aws iam get-role \
    --role-name "$TASK_ROLE_NAME" \
    --query "Role.Arn" \
    --output text
)

echo "Task Role: $TASK_ROLE_ARN"

echo "Updating task role permissions..."

# sns:Publish has no per-resource ARN for SMS (it targets a phone number, not
# a topic) — "*" is the normal scope for it. Cognito admin actions are scoped
# to this one user pool, and skipped entirely if it isn't configured.
TASK_ROLE_STATEMENTS='[
  { "Effect": "Allow", "Action": "sns:Publish", "Resource": "*" }'

if [ -n "$COGNITO_USER_POOL_ID" ]; then
  TASK_ROLE_STATEMENTS="${TASK_ROLE_STATEMENTS},
  {
    \"Effect\": \"Allow\",
    \"Action\": [\"cognito-idp:AdminAddUserToGroup\", \"cognito-idp:AdminUpdateUserAttributes\"],
    \"Resource\": \"arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/${COGNITO_USER_POOL_ID}\"
  }"
fi

TASK_ROLE_STATEMENTS="${TASK_ROLE_STATEMENTS}
]"

aws iam put-role-policy \
  --role-name "$TASK_ROLE_NAME" \
  --policy-name "hirondelle-backend-runtime" \
  --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":${TASK_ROLE_STATEMENTS}}" \
  >/dev/null


# ============================================================
# 6ter. Ensure CloudWatch log group exists
# ============================================================

LOG_GROUP="/ecs/${SERVICE_NAME}"

echo ""
echo "Checking CloudWatch log group..."

CREATE_LOG_GROUP_OUTPUT=$(
  aws logs create-log-group \
    --log-group-name "$LOG_GROUP" \
    --region "$REGION" \
    2>&1
) || {
  if ! echo "$CREATE_LOG_GROUP_OUTPUT" | grep -q "ResourceAlreadyExistsException"; then
    echo "ERROR: could not create CloudWatch log group '$LOG_GROUP'." >&2
    echo "$CREATE_LOG_GROUP_OUTPUT" >&2
    exit 1
  fi
}

echo "Log group: $LOG_GROUP"


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
  "$MEMORY" \
  "$LOG_GROUP" \
  "$REGION" \
  "$TASK_ROLE_ARN" <<'PY'

import json
import os
import sys

family = sys.argv[1]
image = sys.argv[2]
role_arn = sys.argv[3]
port = int(sys.argv[4])
cpu = sys.argv[5]
memory = sys.argv[6]
log_group = sys.argv[7]
log_region = sys.argv[8]
task_role_arn = sys.argv[9]

# Always set: the SDK calls made from inside the container (SNS, Cognito
# admin) need to know their region, and nothing else in this environment
# supplies it.
environment = [{"name": "AWS_REGION", "value": log_region}]

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
    "taskRoleArn": task_role_arn,

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

            "environment": environment,

            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group,
                    "awslogs-region": log_region,
                    "awslogs-stream-prefix": "ecs"
                }
            }
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

if [ "$SERVICE_STATUS" != "ACTIVE" ]; then

  # A deleted service lingers as INACTIVE instead of disappearing, so any
  # status other than ACTIVE (missing, INACTIVE, DRAINING) means we need to
  # create a fresh service rather than update one that no longer runs.

  echo ""
  echo "Creating ECS service: $SERVICE_NAME"

  CONTAINER_NAME="${SERVICE_NAME}-task"
  CONTAINER_NAME="${CONTAINER_NAME%-task}"

  CREATE_SERVICE_ARGS=(
    --cluster "$CLUSTER_NAME"
    --service-name "$SERVICE_NAME"
    --task-definition "$TASK_DEF_ARN"
    --desired-count 1
    --launch-type FARGATE
    --network-configuration
      "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}"
    --region "$REGION"
  )

  if [ -n "$TARGET_GROUP_ARN" ]; then
    CREATE_SERVICE_ARGS+=(
      --load-balancers
        "targetGroupArn=$TARGET_GROUP_ARN,containerName=$CONTAINER_NAME,containerPort=$TARGET_PORT"
    )
  fi

  aws ecs create-service "${CREATE_SERVICE_ARGS[@]}" >/dev/null

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