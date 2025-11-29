#!/usr/bin/env node

/**
 * Production Configuration Verification Script
 * Run this script to verify all production configurations are correct
 * Usage: node scripts/verifyProductionConfig.js
 */

require('dotenv').config();
const { validateEnv } = require('../src/config/validateEnv');
const { testConnection } = require('../src/config/database');
const logger = require('../src/utils/logger');

const checks = [];
let passed = 0;
let failed = 0;

function addCheck(name, checkFn) {
    checks.push({ name, checkFn });
}

function logResult(name, success, message = '') {
    if (success) {
        console.log(`✅ ${name}${message ? ': ' + message : ''}`);
        passed++;
    } else {
        console.error(`❌ ${name}${message ? ': ' + message : ''}`);
        failed++;
    }
}

async function runChecks() {
    console.log('🔍 Verifying Production Configuration...\n');

    // Check 1: Environment Variables
    addCheck('Environment Variables', async () => {
        try {
            validateEnv();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // Check 2: Database Connection
    addCheck('Database Connection', async () => {
        try {
            await testConnection();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // Check 3: Required Environment Variables
    addCheck('Required Environment Variables', async () => {
        const required = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
        const missing = required.filter(key => !process.env[key]);

        if (process.env.NODE_ENV === 'production') {
            required.push('DATABASE_URL');
            if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
                missing.push('DATABASE_URL or DB_* variables');
            }
        }

        return {
            success: missing.length === 0,
            message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required vars present'
        };
    });

    // Check 4: JWT Secret Strength
    addCheck('JWT Secret Strength', async () => {
        if (!process.env.JWT_SECRET) {
            return { success: false, message: 'JWT_SECRET not set' };
        }

        const secret = process.env.JWT_SECRET;
        const isStrong = secret.length >= 32;
        const isNotDefault = !secret.includes('development') &&
            !secret.includes('test') &&
            !secret.includes('change-this');

        return {
            success: isStrong && isNotDefault,
            message: isStrong && isNotDefault
                ? 'Strong secret'
                : 'Secret too weak or appears to be default'
        };
    });

    // Check 5: Port Configuration
    addCheck('Port Configuration', async () => {
        const port = parseInt(process.env.PORT || '3000');
        return {
            success: port > 0 && port < 65536,
            message: `Port: ${port}`
        };
    });

    // Check 6: CORS Configuration (Production)
    addCheck('CORS Configuration', async () => {
        if (process.env.NODE_ENV !== 'production') {
            return { success: true, message: 'Skipped (not production)' };
        }

        if (!process.env.CORS_ORIGINS) {
            return { success: false, message: 'CORS_ORIGINS not set for production' };
        }

        const origins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
        const hasHttps = origins.some(o => o.startsWith('https://'));

        return {
            success: hasHttps,
            message: hasHttps ? `Configured for ${origins.length} origin(s)` : 'No HTTPS origins configured'
        };
    });

    // Check 7: Rate Limiting Configuration
    addCheck('Rate Limiting', async () => {
        const rateLimit = parseInt(process.env.RATE_LIMIT_MAX || '100');
        const isAppropriate = rateLimit >= 50 && rateLimit <= 500;

        return {
            success: isAppropriate,
            message: `Set to ${rateLimit} requests per 15 minutes`
        };
    });

    // Check 8: Database Pool Configuration
    addCheck('Database Pool', async () => {
        const poolMax = parseInt(process.env.DB_POOL_MAX || '5');
        const isAppropriate = poolMax >= 3 && poolMax <= 20;

        return {
            success: isAppropriate,
            message: `Max connections: ${poolMax}`
        };
    });

    // Check 9: PM2 Configuration
    addCheck('PM2 Memory Limit', async () => {
        const memory = process.env.PM2_MAX_MEMORY || '400M';
        const isAppropriate = memory.includes('M') && parseInt(memory) <= 500;

        return {
            success: isAppropriate,
            message: `Memory limit: ${memory}`
        };
    });

    // Check 10: Node Environment
    addCheck('Node Environment', async () => {
        const env = process.env.NODE_ENV;
        const isValid = ['development', 'production', 'test'].includes(env);

        return {
            success: isValid,
            message: env || 'Not set'
        };
    });

    // Run all checks
    for (const check of checks) {
        try {
            const result = await check.checkFn();
            logResult(check.name, result.success, result.message);
        } catch (error) {
            logResult(check.name, false, error.message);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Summary: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('✅ All checks passed! Ready for production deployment.');
        process.exit(0);
    } else {
        console.log('❌ Some checks failed. Please fix the issues above before deploying.');
        process.exit(1);
    }
}

// Run verification
runChecks().catch(error => {
    console.error('❌ Verification script failed:', error.message);
    process.exit(1);
});

