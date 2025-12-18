-- Script pour ajouter des dépenses de test pour tester la pagination
-- Ce script ajoute 12 dépenses pour le premier utilisateur actif du mois en cours
-- Pour tester la pagination (5 dépenses par page = 3 pages)

-- Récupérer le premier utilisateur actif
DO $$
DECLARE
    test_user_id uuid;
    current_year int;
    current_month int;
    expense_date timestamp with time zone;
    i int;
BEGIN
    -- Récupérer le premier utilisateur actif
    SELECT "Id" INTO test_user_id
    FROM "users"
    WHERE "IsActive" = true
    LIMIT 1;

    -- Si aucun utilisateur actif n'existe, on ne fait rien
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Aucun utilisateur actif trouvé. Veuillez créer un utilisateur actif d''abord.';
        RETURN;
    END IF;

    -- Récupérer l'année et le mois actuels
    current_year := EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    current_month := EXTRACT(MONTH FROM CURRENT_TIMESTAMP);

    -- Ajouter 12 dépenses pour le mois en cours
    FOR i IN 1..12 LOOP
        -- Répartir les dépenses sur le mois (du 1er au 25)
        expense_date := make_timestamp(current_year, current_month, (i % 25) + 1, 10, 0, 0);
        
        INSERT INTO "expenses" (
            "Id",
            "Description",
            "Amount",
            "Date",
            "Category",
            "UserId",
            "BillingCompany",
            "BillingStreet",
            "BillingPostalCode",
            "BillingCity"
        ) VALUES (
            gen_random_uuid(),
            CASE i
                WHEN 1 THEN 'Repas d''affaires - Restaurant'
                WHEN 2 THEN 'Transport en taxi'
                WHEN 3 THEN 'Hôtel pour déplacement'
                WHEN 4 THEN 'Fournitures de bureau'
                WHEN 5 THEN 'Carburant'
                WHEN 6 THEN 'Parking'
                WHEN 7 THEN 'Déjeuner client'
                WHEN 8 THEN 'Train Paris-Lyon'
                WHEN 9 THEN 'Petit-déjeuner réunion'
                WHEN 10 THEN 'Location de voiture'
                WHEN 11 THEN 'Frais de péage'
                WHEN 12 THEN 'Dîner d''affaires'
            END,
            CASE i
                WHEN 1 THEN 45.50
                WHEN 2 THEN 28.00
                WHEN 3 THEN 120.00
                WHEN 4 THEN 35.75
                WHEN 5 THEN 65.20
                WHEN 6 THEN 12.50
                WHEN 7 THEN 55.00
                WHEN 8 THEN 89.90
                WHEN 9 THEN 18.30
                WHEN 10 THEN 95.00
                WHEN 11 THEN 8.50
                WHEN 12 THEN 72.00
            END,
            expense_date,
            CASE i
                WHEN 1 THEN 'Restaurant'
                WHEN 2 THEN 'Transport'
                WHEN 3 THEN 'Hébergement'
                WHEN 4 THEN 'Fournitures'
                WHEN 5 THEN 'Transport'
                WHEN 6 THEN 'Transport'
                WHEN 7 THEN 'Restaurant'
                WHEN 8 THEN 'Transport'
                WHEN 9 THEN 'Restaurant'
                WHEN 10 THEN 'Transport'
                WHEN 11 THEN 'Transport'
                WHEN 12 THEN 'Restaurant'
            END,
            test_user_id,
            CASE i
                WHEN 1 THEN 'Restaurant Le Gourmet'
                WHEN 2 THEN 'Taxi Parisien'
                WHEN 3 THEN 'Hôtel Central'
                WHEN 4 THEN 'Papeterie Moderne'
                WHEN 5 THEN 'Station Total'
                WHEN 6 THEN 'Parking Central'
                WHEN 7 THEN 'Brasserie du Centre'
                WHEN 8 THEN 'SNCF'
                WHEN 9 THEN 'Café des Arts'
                WHEN 10 THEN 'Europcar'
                WHEN 11 THEN 'Autoroutes de France'
                WHEN 12 THEN 'Restaurant La Belle Époque'
            END,
            (10 + i) || ' Rue de la Paix',
            '75001',
            'Paris'
        );
    END LOOP;

    RAISE NOTICE '12 dépenses de test ajoutées pour l''utilisateur %', test_user_id;
END $$;

