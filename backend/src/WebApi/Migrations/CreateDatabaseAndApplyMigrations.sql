-- Script pour créer la base de données et appliquer toutes les migrations
-- À exécuter manuellement si les migrations Entity Framework ne fonctionnent pas

-- 1. Créer la table users (migration Initial)
CREATE TABLE IF NOT EXISTS "users" (
    "Id" uuid NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    CONSTRAINT "PK_users" PRIMARY KEY ("Id")
);

-- 2. Ajouter la colonne IsActive (migration AddIsActiveToUser)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'IsActive'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "IsActive" boolean NOT NULL DEFAULT true;
    END IF;
END $$;

-- 3. Ajouter la colonne MonthlyExpenseQuota (migration AddMonthlyExpenseQuota)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'MonthlyExpenseQuota'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "MonthlyExpenseQuota" numeric(18,2) NOT NULL DEFAULT 1000.00;
    END IF;
END $$;

-- 4. Créer la table expenses (migration AddExpenseEntity)
CREATE TABLE IF NOT EXISTS "expenses" (
    "Id" uuid NOT NULL,
    "Description" character varying(50) NOT NULL,
    "Amount" numeric NOT NULL,
    "Date" timestamp with time zone NOT NULL,
    "Category" text,
    "UserId" uuid NOT NULL,
    "BillingCompany" text,
    "BillingStreet" text,
    "BillingPostalCode" text,
    "BillingCity" text,
    CONSTRAINT "PK_expenses" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_expenses_users_UserId" FOREIGN KEY ("UserId") 
        REFERENCES "users" ("Id") ON DELETE RESTRICT
);

-- 5. Créer les index pour expenses
CREATE INDEX IF NOT EXISTS "IX_expenses_Date" ON "expenses" ("Date");
CREATE INDEX IF NOT EXISTS "IX_expenses_UserId" ON "expenses" ("UserId");

-- 6. Créer la table __EFMigrationsHistory si elle n'existe pas
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- 7. Insérer les entrées de migration dans __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20251015145618_Initial', '9.0.9'),
    ('20251213190000_AddIsActiveToUser', '9.0.9'),
    ('20251213205929_AddExpenseEntity', '9.0.9'),
    ('20251213223710_AddMonthlyExpenseQuota', '9.0.9')
ON CONFLICT ("MigrationId") DO NOTHING;

