#!/bin/bash

# FittedIn Database Backup Script
# This script creates a backup of the PostgreSQL database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fittedin}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Database connection from environment variables
DB_NAME="${DB_NAME:-fittedin_prod}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "${GREEN}🗄️  Starting database backup...${NC}"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/fittedin_backup_$TIMESTAMP.sql"

# Perform backup
if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
    # Compress backup
    gzip $BACKUP_FILE
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}📦 Backup size: $FILE_SIZE${NC}"
    
    # Clean up old backups (older than retention period)
    echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
    find $BACKUP_DIR -name "fittedin_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo -e "${GREEN}✅ Backup completed successfully${NC}"
    
    # Optional: Upload to S3 (uncomment if needed)
    # if command -v aws &> /dev/null; then
    #     echo -e "${YELLOW}📤 Uploading to S3...${NC}"
    #     aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database-backups/
    #     echo -e "${GREEN}✅ Uploaded to S3${NC}"
    # fi
    
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

