# ECR setup for GitHub Actions deployer

Steps for granting the deployer permissions or pre-creating the repository used by CI:

1. Attach the IAM policy in `iam-policy-ecr.json` to the principal used by your GitHub Actions secrets (for example `github-actions-deployer`).

   - Use the AWS Console (IAM → Users/Roles → Attach policy) or the CLI to attach the policy.

2. Alternatively, pre-create the ECR repository using an admin account:

```bash
aws ecr create-repository --repository-name YOUR_REPO_NAME --region ca-central-1
```

3. Confirm the repository name matches the secret `ECR_REPOSITORY` in the repository environment `deployer_aws_prod`.

4. Re-run the GitHub Actions workflow after applying the permission or creating the repo.
