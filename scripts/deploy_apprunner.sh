#!/usr/bin/env bash
set -euo pipefail

REGION=${AWS_REGION:?}
ACCOUNT_ID=${AWS_ACCOUNT_ID:?}
REPO=${ECR_REPOSITORY:?}
IMAGE_TAG=${IMAGE_TAG:?}
SERVICE_NAME=${SERVICE_NAME:?}
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO}:${IMAGE_TAG}"

# Find existing service by name
SERVICE_ARN=$(aws apprunner list-services --region "$REGION" --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'] | [0].ServiceArn" --output text)

if [ "$SERVICE_ARN" = "None" ] || [ "$SERVICE_ARN" = "null" ] || [ -z "$SERVICE_ARN" ]; then
  echo "Creating App Runner service $SERVICE_NAME"
  aws apprunner create-service --region "$REGION" --service-name "$SERVICE_NAME" \
    --source-configuration "ImageRepository={ImageIdentifier=${IMAGE_URI},ImageRepositoryType=ECR,ImageConfiguration={Port=8080,RuntimeEnvironmentVariables=[{Name=MONGODB_URI,Value=${MONGODB_URI}},{Name=COGNITO_USER_POOL_ID,Value=${COGNITO_USER_POOL_ID}},{Name=COGNITO_CLIENT_ID,Value=${COGNITO_CLIENT_ID}},{Name=COGNITO_REGION,Value=${COGNITO_REGION}}]}}"
else
  echo "Updating App Runner service $SERVICE_NAME ($SERVICE_ARN)"
  aws apprunner update-service --region "$REGION" --service-arn "$SERVICE_ARN" \
    --source-configuration "ImageRepository={ImageIdentifier=${IMAGE_URI},ImageRepositoryType=ECR,ImageConfiguration={Port=8080,RuntimeEnvironmentVariables=[{Name=MONGODB_URI,Value=${MONGODB_URI}},{Name=COGNITO_USER_POOL_ID,Value=${COGNITO_USER_POOL_ID}},{Name=COGNITO_CLIENT_ID,Value=${COGNITO_CLIENT_ID}},{Name=COGNITO_REGION,Value=${COGNITO_REGION}}]}}"
fi

echo "Deployment command finished. Use 'aws apprunner list-services' to check status." 
