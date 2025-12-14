describe('Expenses E2E', () => {
  beforeEach(() => {
    cy.visit('/expenses');
  });

  it('should display expenses page', () => {
    cy.contains('Liste des dépenses').should('be.visible');
  });

  it('should have add expense button', () => {
    cy.contains('Ajouter une dépense').should('be.visible');
  });

  it('should display expenses list or empty state', () => {
    // Attendre que le chargement soit terminé
    cy.get('.loading').should('not.exist');
    
    // Vérifier que soit la table soit le message vide est présent
    // Utiliser une approche qui vérifie les deux cas sans conditions dans les callbacks
    cy.get('.expense-list-container').should('exist');
    
    // Vérifier que l'un ou l'autre est présent (sans utiliser cy.get dans un if)
    cy.get('body').should(($body) => {
      const hasTable = $body.find('.expense-table').length > 0;
      const hasEmpty = $body.find('.empty').length > 0;
      expect(hasTable || hasEmpty, 'Either expense table or empty message should be visible').to.be.true;
    });
    
    // Vérifier explicitement selon ce qui est présent
    cy.get('.expense-table, .empty').should('exist');
  });
});

