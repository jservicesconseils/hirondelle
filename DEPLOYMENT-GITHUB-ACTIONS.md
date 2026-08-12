GitHub Actions — déploiement App Runner (backend)

Secrets GitHub requis (Repository > Settings > Secrets) — pour ECS/Fargate:

- `AWS_ACCESS_KEY_ID` (clé IAM avec accès ECR + ECS)
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (ex. `us-east-1`)
- `AWS_ACCOUNT_ID` (ID de compte AWS)
- `ECR_REPOSITORY` (nom du repo ECR, ex. `roseehermon-backend`)
- `ECS_CLUSTER_NAME` (ex. `hirondelle-cluster`)
- `ECS_SERVICE_NAME` (ex. `roseehermon-backend`)
- `MONGODB_URI` (ex. `mongodb+srv://...`)
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `COGNITO_REGION`

IAM minimal recommandé:

- Créez un utilisateur IAM avec accès programmatique (Access Key + Secret).
- Attachez-lui les policies gérées suivantes: `AmazonEC2ContainerRegistryFullAccess`, `AWSAppRunnerFullAccess`.

Déclencher le workflow:

1. Pousser sur la branche `main`:

```bash
git add .
git commit -m "Deploy: build and push backend image"
git push origin main
```

2. Sur GitHub, ouvrez Actions → choisissez le workflow "Deploy backend to ECS (Fargate)" pour suivre l'exécution.

Contrôles utiles (local / AWS CLI):

```bash
# lister les images ECR
aws ecr describe-repositories --region $AWS_REGION
aws ecr list-images --repository-name $ECR_REPOSITORY --region $AWS_REGION

# status App Runner
aws apprunner list-services --region $AWS_REGION
aws apprunner describe-service --service-arn <service-arn> --region $AWS_REGION
```

Remarques de sécurité:

- Ne mettez jamais `MONGODB_URI` ou `AWS_*` en clair dans le code ou dans les fichiers committés.
- Révoquez les clés IAM si vous les régénérez.
