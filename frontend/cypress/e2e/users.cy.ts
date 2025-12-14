describe('Users E2E', () => {
  beforeEach(() => {
    cy.visit('/users');
  });

  it('should display users page', () => {
    cy.contains('Liste des utilisateurs').should('be.visible');
  });

  it('should have add user button', () => {
    cy.contains('Ajouter un utilisateur').should('be.visible');
  });

  it('should display users list or empty state', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.user-list').length > 0) {
        cy.get('.user-list').should('be.visible');
      } else {
        cy.contains('Aucun utilisateur trouvé').should('be.visible');
      }
    });
  });
});

