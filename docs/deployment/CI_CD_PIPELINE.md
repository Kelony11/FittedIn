# CI/CD Pipeline Guide

Complete guide for setting up Continuous Integration and Continuous Deployment for FittedIn using GitHub Actions.

> **Quick Start**: For a faster setup guide, see [CI/CD Quick Start](CI_CD_QUICK_START.md)  
> **Full DevOps Guide**: For comprehensive DevOps documentation, see [DevOps Guide](DEVOPS_GUIDE.md)

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [GitHub Actions Setup](#github-actions-setup)
- [Workflow Configuration](#workflow-configuration)
- [Deployment Process](#deployment-process)
- [Testing Strategy](#testing-strategy)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers setting up CI/CD for FittedIn with:
- ✅ Automated testing on pull requests
- ✅ Automated deployment to EC2
- ✅ Health checks after deployment
- ✅ Rollback capabilities
- ✅ Security scanning

**Pipeline Flow:**
```
Push to main → Tests → Build → Deploy → Health Check → Notify
```

---

## Prerequisites

1. **GitHub Repository**
   - Repository with code
   - GitHub Actions enabled

2. **AWS Account**
   - EC2 instance running
   - IAM user with deployment permissions
   - SSH access configured

3. **GitHub Secrets**
   - AWS credentials
   - EC2 SSH key
   - EC2 connection details

---

## GitHub Actions Setup

### Step 1: Configure GitHub Secrets

Navigate to: Repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `EC2_SSH_PRIVATE_KEY` | SSH private key for EC2 | Contents of `.pem` file |
| `EC2_HOST` | EC2 instance IP or domain | `ec2-xx-xx-xx-xx.compute-1.amazonaws.com` |
| `EC2_USER` | SSH user for EC2 | `ubuntu` or `ec2-user` |

### Step 2: Verify Workflow Files

The workflow files are located in `.github/workflows/`:
- `test.yml` - Runs tests on PRs
- `deploy.yml` - Deploys to EC2 on push to main

### Step 3: Test the Pipeline

1. **Create a test branch:**
   ```bash
   git checkout -b test-ci-cd
   git push origin test-ci-cd
   ```

2. **Create a pull request** to trigger test workflow

3. **Merge to main** to trigger deployment

---

## Workflow Configuration

### Test Workflow (`test.yml`)

Runs on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run database migrations (test DB)
5. Run tests
6. Upload coverage (if configured)

### Deploy Workflow (`deploy.yml`)

Runs on:
- Push to `main` or `production` branch
- Manual trigger (workflow_dispatch)

**Steps:**
1. Run tests (must pass)
2. Configure AWS credentials
3. Setup SSH
4. Deploy to EC2:
   - Pull latest code
   - Install dependencies
   - Run migrations
   - Restart application
5. Health check
6. Notify status

---

## Deployment Process

### Automated Deployment

When code is pushed to `main`:

1. **Tests Run** (if configured)
   - Unit tests
   - Integration tests
   - Linting

2. **Deployment**
   - SSH to EC2 instance
   - Pull latest code from `main` branch
   - Install/update dependencies
   - Run database migrations
   - Restart PM2 processes
   - Reload Nginx

3. **Verification**
   - Health check endpoint
   - Verify application is responding

4. **Notification**
   - Success/failure notification

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to AWS EC2** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### Deployment Script

The deployment uses SSH to run commands on EC2:

```bash
ssh user@host << 'ENDSSH'
  cd /var/www/fittedin
  git pull origin main
  cd backend
  npm install --production
  npm run db:migrate
  pm2 restart fittedin-backend
ENDSSH
```

---

## Testing Strategy

### Unit Tests

Run with Jest:
```bash
cd backend
npm test
```

### Integration Tests

Test API endpoints:
```bash
npm run test:integration
```

### E2E Tests (Optional)

Test full user flows:
```bash
npm run test:e2e
```

### Test Coverage

Configure coverage reporting:
```yaml
# In test.yml
- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

---

## Security Best Practices

### 1. Secret Management

- ✅ Never commit secrets to repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly
- ✅ Use least privilege IAM policies

### 2. IAM Permissions

Create a dedicated IAM user for CI/CD with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. SSH Key Security

- ✅ Use dedicated SSH key for CI/CD
- ✅ Restrict SSH key to specific user/IP
- ✅ Rotate keys regularly
- ✅ Use SSH agent forwarding when possible

### 4. Code Scanning

Add security scanning to workflow:

```yaml
- name: Run security scan
  uses: github/super-linter@v4
  env:
    DEFAULT_BRANCH: main
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 5. Dependency Scanning

Scan for vulnerable dependencies:

```yaml
- name: Run npm audit
  run: npm audit --audit-level=moderate
```

---

## Advanced Configuration

### Multi-Environment Deployment

Deploy to different environments based on branch:

```yaml
- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: |
    # Deploy to staging EC2
    ssh user@staging-host ...

- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: |
    # Deploy to production EC2
    ssh user@production-host ...
```

### Blue-Green Deployment

Implement blue-green deployment:

```yaml
- name: Deploy to green environment
  run: |
    # Deploy to green EC2
    # Update load balancer to point to green
    # Health check green
    # If healthy, keep green, else rollback
```

### Database Migration Strategy

Safe migration deployment:

```yaml
- name: Run migrations (dry-run)
  run: npm run db:migrate -- --dry-run

- name: Backup database
  run: ./scripts/backup-database.sh

- name: Run migrations
  run: npm run db:migrate

- name: Verify migration
  run: npm run db:migrate:status
```

---

## Troubleshooting

### Deployment Fails

**Problem**: Deployment step fails

**Solutions**:
1. Check SSH connection: `ssh -v user@host`
2. Verify SSH key in GitHub Secrets
3. Check EC2 security group allows SSH
4. Verify user has sudo permissions
5. Check deployment logs in GitHub Actions

### Tests Fail

**Problem**: Tests fail in CI but pass locally

**Solutions**:
1. Check Node.js version matches
2. Verify database is set up correctly
3. Check environment variables
4. Review test logs for specific errors

### Health Check Fails

**Problem**: Health check fails after deployment

**Solutions**:
1. Check application logs: `pm2 logs`
2. Verify application is running: `pm2 status`
3. Check Nginx configuration: `sudo nginx -t`
4. Verify port 3000 is accessible
5. Check firewall rules

### Permission Denied

**Problem**: Permission denied errors

**Solutions**:
1. Verify SSH key permissions
2. Check file permissions on EC2
3. Verify user has required permissions
4. Check IAM role permissions

---

## Monitoring Deployments

### GitHub Actions Dashboard

View deployment history:
- Go to **Actions** tab
- Select workflow
- View run history and logs

### Deployment Notifications

Configure notifications:
1. GitHub → Settings → Notifications
2. Enable workflow notifications
3. Add email/Slack integration

### Deployment Metrics

Track deployment metrics:
- Success rate
- Deployment frequency
- Mean time to recovery (MTTR)

---

## Best Practices

1. ✅ **Test Before Deploy**
   - Always run tests before deployment
   - Use staging environment for testing

2. ✅ **Incremental Deployments**
   - Deploy small, frequent changes
   - Avoid large deployments

3. ✅ **Rollback Plan**
   - Keep previous version available
   - Document rollback procedure
   - Test rollback process

4. ✅ **Monitor After Deploy**
   - Watch application logs
   - Monitor error rates
   - Check performance metrics

5. ✅ **Documentation**
   - Document deployment process
   - Keep runbook updated
   - Document known issues

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [CI/CD Best Practices](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)

---

**Last Updated**: 2024

