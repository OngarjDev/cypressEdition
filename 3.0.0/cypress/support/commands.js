// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import * as utils from './utils';

Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});


Cypress.Commands.add("getBySelLike", (selector, ...args) => {
  return cy.get(`[data-test*=${selector}]`, ...args);
});


Cypress.Commands.add("setTimezone", (tz) => {
  Cypress.automation("remote:debugger:protocol", {
    command: "Emulation.setTimezoneOverride",
    params: { timezoneId: tz },
  });
});


Cypress.Commands.add("clearTimezone", () => {
  Cypress.automation("remote:debugger:protocol", {
    command: "Emulation.clearTimezoneOverride",
  });
});


Cypress.Commands.add('signIn', (username, password) => {
  Cypress.Keyboard.defaults({keystrokeDelay: 0})
  cy.session([username], () => {
    cy.visit('/reserve.html') ;
    cy.wait(Cypress.config().keycloakWaitMs) ;
    
    if (!utils.baseUrlIsPublic()) {
        cy.origin('https://bscit.sit.kmutt.ac.th/', { args: { username, password } }, ({ username, password }) => {
            cy.get('input#username').type(username) ;
            cy.get('input#password').type(password) ;
            cy.get('button[type=submit]').click() ;
        }) ;
    } else {
        cy.get('input#username').type(username) ;
        cy.get('input#password').type(password) ;
        cy.get('button[type=submit]').click() ;
    } ;
    cy.wait(Cypress.config().keycloakWaitMs) ;
    cy.url().should('contain','/reserve.html') ;  
  }) ;
});


Cypress.Commands.add('shouldBeHiddenOrNotExist', (selector) => {
  cy.get('body').then($body => {

    // CASE 1: Element does NOT exist → treat as hidden & not clickable
    if ($body.find(selector).length === 0) {
      expect(true, `${selector} does not exist`).to.be.true;
      return;
    }

    // CASE 2: Element exists → check visibility & accessibility
    cy.get(selector, { timeout: 300 }).should($el => {
      const el = $el[0];
      const style = getComputedStyle(el);

      // Hidden conditions
      const invisible =
        !$el.is(':visible') ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) === 0;

      expect(
        invisible,
        `${selector} should be HIDDEN`
      ).to.be.true;
    });
  });
});


Cypress.Commands.add('shouldBeVisibleAndNotClickable', (selector) => {
  cy.get(selector, { timeout: 300 }).should($el => {
    const el = $el[0];
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    // --- Visible checks ---
    const isVisible =
      $el.is(':visible') &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) > 0;

    expect(
      isVisible,
      `${selector} should be VISIBLE`
    ).to.be.true;

    // --- Not clickable checks ---
    const disabled = $el.is(':disabled');

    const notClickable = disabled ;

    expect(
      notClickable,
      `${selector} should be NOT CLICKABLE`
    ).to.be.true;
  });
});


Cypress.Commands.add('shouldBeVisibleAndClickable', selector => {
  cy.get(selector, { timeout: 500 }).should($el => {
    const style = getComputedStyle($el[0]);
    const rect = $el[0].getBoundingClientRect();

    const visible =
      $el.is(':visible') &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) > 0;

    const enabled = !$el.is(':disabled');

    expect(
      visible && enabled,
      `${selector} should be visible AND clickable`
    ).to.be.true;
  });
});


Cypress.Commands.add('shouldShowDialog', (expectedMessage) => {
  // Assert dialog is open and visible
  cy.get('.ecors-dialog')
    // .should('have.attr', 'open')
    .should('be.visible');

  // Assert message
  cy.get('.ecors-dialog-message')
    .should('have.text', expectedMessage);

  // Assert OK button exists and is visible
  // cy.get('.ecors-button-dialog')
  //   .contains(/^OK$/i)
  //   .should('be.visible');
});


Cypress.Commands.add('shouldCloseDialog', () => {
  cy.get('body').then($body => {

    // Element does NOT exist → treat as closed
    if ($body.find('.ecors-dialog').length === 0) {
      expect(true, `.ecors-dialog does not exist`).to.be.true;
      return;
    }
    // Element exists → check that it is not open
    cy.get('.ecors-dialog')
      .should('not.have.attr', 'open');
  });
});