describe('Módulo de Autenticación Real - Pulse GYM', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/auth/login');
  });

  it('Debe autenticar con credenciales reales y cargar el Dashboard de Admin', () => {
    cy.intercept('POST', '**/pg-ms-auth/auth/login').as('realLogin');
    cy.intercept('GET', '**/pg-ms-users/api/v1/dashboard/resumen').as('realDashboard');

    cy.get('input[formControlName="email"]').type('adminprueba1@gmail.com');
    cy.get('input[formControlName="password"]').type('Me@12345');
    cy.get('button[type="submit"]').click();

    cy.wait('@realLogin').its('response.statusCode').should('be.oneOf', [200, 202]);

    cy.url({ timeout: 10000 }).should('include', '/dashboard-admin');

    cy.wait('@realDashboard').its('response.statusCode').should('eq', 200);
  });
});