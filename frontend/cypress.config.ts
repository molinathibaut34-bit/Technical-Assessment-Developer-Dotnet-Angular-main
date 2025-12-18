import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

// Utiliser le port du serveur de développement depuis la variable d'environnement
// ou le port par défaut 4200
const port = process.env.PORT || process.env.CYPRESS_PORT || '63791';
const baseUrl = process.env.CYPRESS_BASE_URL || `http://localhost:${port}`;

const preset = nxE2EPreset(__dirname);

export default defineConfig({
  e2e: {
    ...preset,
    // Utiliser l'URL du serveur de développement
    // Le preset Nx peut surcharger cela si devServerTarget est utilisé
    baseUrl: preset.baseUrl || baseUrl,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'cypress/fixtures',
    setupNodeEvents(on, config) {
      // Le preset Nx gère automatiquement l'URL quand devServerTarget est utilisé
      // Sinon, utilise l'URL définie ci-dessus basée sur PORT
      return config;
    },
  },
  video: true,
  screenshotOnRunFailure: true,
});

