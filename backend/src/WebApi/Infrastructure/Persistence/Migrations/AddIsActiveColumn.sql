-- Migration: Add IsActive column to users table
-- Run this script manually if the migration hasn't been applied automatically

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT true;

