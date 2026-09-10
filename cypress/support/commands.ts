// cypress/support/commands.ts

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Inicia sesión escribiendo las credenciales reales en el formulario
       * @param email Correo del usuario
       * @param password Contraseña del usuario
       */
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string = 'krisgallego7@gmail.com', password: string = 'Gallego2&') => {
  cy.visit('/auth/login');
  
  cy.get('input[formControlName="email"]').type(email);
  cy.get('input[formControlName="password"]').type(password);
  cy.get('button[type="submit"]').click();

  cy.url().should('include', '/user');
});

export {};