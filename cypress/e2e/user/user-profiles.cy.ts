describe('Módulo de Gestión de Perfiles Real - Pulse GYM', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    
    cy.visit('/auth/login');
    cy.get('input[formControlName="email"]').type('juanjosemorenobenavides207@gmail.com');
    cy.get('input[formControlName="password"]').type('Me@12345');
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('include', '/dashboard-admin');

    cy.visit('/dashboard-admin/users/profiles');
  });

  it('Debe obtener y renderizar los usuarios reales guardados en la BD', () => {
    cy.get('.perfil-card, table tbody tr', { timeout: 12000 }).should('have.length.at.least', 1);
  });

  it('Debe filtrar la lista utilizando la búsqueda en el backend real', () => {
    cy.get('input[placeholder*="Buscar"]').type('Juan{enter}');

    cy.get('.perfil-card, table tbody tr', { timeout: 10000 }).should('exist');
  });
});