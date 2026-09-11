describe('Cambio Obligatorio de Contraseña', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/auth/cambiar-contrasena-obligatorio');
  });

  it('Debe validar que las contraseñas coincidan antes de enviar', () => {
    cy.get('input[formControlName="currentPassword"]').type('PasswordTemporal123*');
    cy.get('input[formControlName="newPassword"]').type('NuevaClave123*');
    cy.get('input[formControlName="confirmPassword"]').type('OtraClave123*');
    cy.get('button[type="submit"]').click();

    cy.contains('Las contraseñas no coinciden').should('be.visible');
  });

  it('Debe procesar el cambio de clave y redirigir al login', () => {
    cy.intercept('POST', '**/pg-ms-auth/auth/change-password', {
      statusCode: 200,
      body: { message: 'Contraseña actualizada con éxito' }
    }).as('changePassword');

    cy.get('input[formControlName="currentPassword"]').type('PasswordTemporal123*');
    cy.get('input[formControlName="newPassword"]').type('NuevaClave2026*');
    cy.get('input[formControlName="confirmPassword"]').type('NuevaClave2026*');
    cy.get('button[type="submit"]').click();

    cy.wait('@changePassword');
    cy.url().should('include', '/auth/login');
  });
});