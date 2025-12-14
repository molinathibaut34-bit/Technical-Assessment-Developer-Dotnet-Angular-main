describe('App E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display navigation', () => {
    cy.get('nav').should('be.visible');
    cy.get('.nav-title').should('contain', 'N2F');
  });

  it('should have navigation links', () => {
    cy.get('.nav-links a').should('have.length.at.least', 1);
    cy.contains('Utilisateurs').should('be.visible');
    cy.contains('Dépenses').should('be.visible');
    cy.contains('Notes de frais').should('be.visible');
  });

  it('should navigate to users page', () => {
    cy.contains('Utilisateurs').click();
    cy.url().should('include', '/users');
  });

  it('should navigate to expenses page', () => {
    cy.contains('Dépenses').click();
    cy.url().should('include', '/expenses');
  });

  it('should navigate to expense reports page', () => {
    cy.contains('Notes de frais').click();
    cy.url().should('include', '/expense-reports');
  });
});

