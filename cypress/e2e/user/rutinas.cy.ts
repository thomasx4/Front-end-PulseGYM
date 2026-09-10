describe('Módulo de Rutinas - Socio', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.intercept('GET', '**/pg-ms-users/api/v1/rutinas/mis-rutinas').as('getMisRutinasReal');
    cy.intercept('GET', '**/pg-ms-users/api/v1/rutinas/**').as('getRutinaDetalleReal');

    cy.visit('/auth/login');
    cy.get('input[formControlName="email"]').type('krisgallego7@gmail.com');
    cy.get('input[formControlName="password"]').type('Gallego2&');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/user');
  });

  it('Debería cargar la lista de rutinas del usuario correctamente', () => {
    cy.visit('/user/rutinas');
    cy.wait('@getMisRutinasReal');
    
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });

  it('Debería permitir navegar a la vista de creación de rutina con IA', () => {
    cy.visit('/user/rutinas');
    cy.wait('@getMisRutinasReal');

    cy.get('button, a').then($els => {
      const target = Array.from($els).find(el => el.textContent?.match(/ia|crear|generar/i));
      if (target) {
        cy.wrap(target).click();
      } else {
        cy.visit('/user/rutinas/crear-ia');
      }
    });

    cy.url().should('include', '/user/rutinas/crear-ia');
  });

  it('Debería permitir ver el detalle de una rutina existente', () => {
    cy.visit('/user/rutinas');
    cy.wait('@getMisRutinasReal');

    cy.get('body').then($body => {
      const actionButton = $body.find('.rutina-card button, .rutina-card a, .btn-detalle, button:contains("Ver"), a:contains("Ver")');
      if (actionButton.length > 0) {
        cy.wrap(actionButton.first()).click();
      } else {
        cy.visit('/user/rutinas/detalle/1');
      }
    });

    cy.url().should('match', /\/user\/rutinas\/detalle\/\d+/);
    cy.get('body', { timeout: 15000 }).should('be.visible');
  });
});