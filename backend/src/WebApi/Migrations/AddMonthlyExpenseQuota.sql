-- Migration: Add MonthlyExpenseQuota to Users table
-- Date: 2025-01-XX

ALTER TABLE "users" 
ADD COLUMN "MonthlyExpenseQuota" DECIMAL(18,2) NOT NULL DEFAULT 1000.00;

-- Update existing users with default quota if needed
UPDATE "users" 
SET "MonthlyExpenseQuota" = 1000.00 
WHERE "MonthlyExpenseQuota" IS NULL;

