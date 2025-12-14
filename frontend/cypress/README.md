# Tests E2E avec Cypress

Ce dossier contient les tests end-to-end (E2E) pour l'application N2F.

## Structure

- `e2e/` - Tests E2E
  - `app.cy.ts` - Tests de navigation et de l'application principale
  - `users.cy.ts` - Tests de la page des utilisateurs
  - `expenses.cy.ts` - Tests de la page des dépenses
- `fixtures/` - Données de test
- `support/` - Commandes et configuration de support
  - `commands.ts` - Commandes personnalisées Cypress
  - `e2e.ts` - Configuration globale

## Commandes disponibles

### Lancer les tests en mode interactif
```bash
npm run e2e:open
# ou
npm run cypress:open
```

### Lancer les tests en mode headless
```bash
npm run e2e
# ou
npm run cypress:run
```

### Lancer les tests en CI
```bash
npm run e2e:ci
```

## Prérequis

Avant de lancer les tests E2E, assurez-vous que :
1. L'application est en cours d'exécution sur `http://localhost:4200`
2. Le backend est démarré et accessible

## Configuration

La configuration Cypress se trouve dans `cypress.config.ts` à la racine du projet.

