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
  return cy.get(`[data-cy=${selector}]`, ...args);
});


Cypress.Commands.add("getBySelMultiple", (selector, ...args) => {
  return cy.get(`[data-cy~=${selector}]`, ...args);
});


Cypress.Commands.add("getBySelLike", (selector, ...args) => {
  return cy.get(`[data-cy*=${selector}]`, ...args);
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

    // enter credentials and submit
    cy.get('input#username').type(username) ;
    cy.get('input#password').type(password) ;
    cy.get('button[type=submit]').click() ;
    
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


Cypress.Commands.add('closeDialogIfPresent', () => {
  cy.get('body').then($body => {
    const $dialog = $body.find('dialog.ecors-dialog[open]');

    if ($dialog.length) {
      // Dialog exists → wrap into Cypress chain
      cy.wrap($dialog).within(() => {
        cy.contains('button', /^OK$/i).click();
      });
    } else {
      // No dialog → do nothing
      cy.log('No dialog to close');
    }
  });
});


Cypress.Commands.add('setServerTime', (isoTime = new Date().toISOString()) => {
  const url = Cypress.env('baseAPI') + '/__test__/time';

  cy.log(`Set server time to ${isoTime}`);
  cy.request('PUT', url, { currentDateTime: isoTime}).then((response) => {
    expect(response.status).to.eq(200);
  });
});


Cypress.Commands.add('resetServerTime', () => {
  const url = Cypress.env('baseAPI') + '/__test__/time';

  cy.log(`Reset server time to real time`);
  cy.request('DELETE', url).then((response) => {
    expect(response.status).to.eq(200);
  });
});


Cypress.Commands.add('shouldBeExpectedReservationPeriods', (expectedReservationPeriods) => {
  if (!expectedReservationPeriods) {
    throw new Error('expectedReservationPeriods is required');
  }

  cy.log('Verifying current reservation periods');
  cy.getBySel('current-message').should('exist').and('be.visible').then(message => {
    const messageText = message.text().trim();
    cy.log(`Current period message: "${messageText}"`);
    expect(messageText).to.equal(expectedReservationPeriods["current-message"]);
  });
  if (expectedReservationPeriods["current-period"] === null) {
    cy.shouldBeInvisible('[data-cy="current-period"]');
  } else {
    cy.getBySel('current-period').should('exist').and('be.visible').then($el => {
      const periodText = $el.text().trim();
      cy.log(`Current period details: "${periodText}"`);
      expect(periodText).to.equal(expectedReservationPeriods["current-period"]);
    });
  };
  cy.getBySel('next-message').should('exist').and('be.visible').then(message => {
    const messageText = message.text().trim();
    cy.log(`Next period message: "${messageText}"`);
    expect(messageText).to.equal(expectedReservationPeriods["next-message"]);
  });
  if (expectedReservationPeriods["next-period"] === null) {
    cy.shouldBeInvisible('[data-cy="next-period"]');
  } else {
    cy.getBySel('next-period').should('exist').and('be.visible').then($el => {
      const periodText = $el.text().trim();
      cy.log(`Next period details: "${periodText}"`);
      expect(periodText).to.equal(expectedReservationPeriods["next-period"]);
    });
  };
});


Cypress.Commands.add('shouldBeInvisible', (selector) => {
  cy.get('body').then($body => {

    // CASE 1: Element does NOT exist
    if ($body.find(selector).length === 0) {
      expect(true, `${selector} does not exist`).to.be.true;
      return;
    }

    // CASE 2: Element exists → check visibility & accessibility
    cy.get(selector, { timeout: 300 }).should($el => {
      const el = $el[0];
      const style = getComputedStyle(el);

      // Hidden or empty conditions
      const invisible =
        !$el.is(':visible') ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) === 0 ||
        el.textContent.trim() === '';

      expect(invisible, `${selector} should not be shown`).to.be.true;
    });
  });
});


Cypress.Commands.add('declarationSectionShouldBeHidden', () => {
  cy.shouldBeHiddenOrNotExist('.ecors-dropdown-plan');
  cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
  cy.shouldBeHiddenOrNotExist('.ecors-button-change');
  cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
});


function findReserveButton($courseOffering) {
  let $btn = $courseOffering.find('[data-cy="button-reserve"]');
  if ($btn.length === 0) {
    $btn = $courseOffering.parent().find('[data-cy="button-reserve"]').first();
  }
  return $btn;
}


Cypress.Commands.add('findReserveButton', ($courseOffering) => {
  const $btn = findReserveButton($courseOffering);
  cy.wrap($btn);
});


// function assertHiddenOrDisabled($btn, label) {
//   // If not in DOM at all, treat as hidden
//   if (!$btn || $btn.length === 0) {
//     expect(true, `${label} not in DOM (treated as hidden)`).to.be.true;
//     return;
//   }

//   const isVisible = Cypress.$($btn).is(':visible');

//   if (isVisible) {
//     expect($btn, `${label} should be disabled when visible`).to.be.disabled;
//   } else {
//     expect($btn, `${label} should be hidden`).not.to.be.visible;
//   }
// }

// function assertVisibleAndClickable($btn, label) {
//   expect($btn, `${label} should exist`).to.have.length(1);
//   cy.wrap($btn)
//     .should('be.visible')
//     .and('be.enabled');
// }


// Cypress.Commands.add('assertReserveAndRemoveButtons', (reservedCourseCodes) => {
//   cy.getBySelMultiple('course-offering').each(($course) => {
//     const courseCode = $course.find('[data-cy="course-code"]').text().trim();

//     const $reserveBtn = findButton($course, 'button-reserve');
//     const $removeBtn  = findButton($course, 'button-remove');

//     if (reservedCourseCodes.includes(courseCode)) {
//       // ✅ Reserved:
//       // Remove: visible & clickable
//       // Reserve: hidden OR disabled
//       assertVisibleAndClickable($removeBtn,  `Remove button for ${courseCode}`);
//       assertHiddenOrDisabled($reserveBtn,    `Reserve button for ${courseCode}`);
//     } else {
//       // ✅ Not reserved:
//       // Reserve: visible & clickable
//       // Remove: hidden OR disabled
//       assertVisibleAndClickable($reserveBtn, `Reserve button for ${courseCode}`);
//       assertHiddenOrDisabled($removeBtn,     `Remove button for ${courseCode}`);
//     }
//   });
// });


// Cypress.Commands.add(
//   'assertDisabledReserveButtons',
//   (disabledCourseCodes) => {

//     cy.getBySelMultiple('course-offering').each(($el) => {
//       const courseCode = $el.find('[data-cy="course-code"]').text().trim();

//       // Find the button either inside the element or in its parent
//       let $button = $el.find('[data-cy="button-reserve"]');
//       if ($button.length === 0) {
//         $button = $el.parent().find('[data-cy="button-reserve"]').first();
//       }

//       const button = cy.wrap($button);

//       // If courseCode is in the disabled list
//       if (disabledCourseCodes.includes(courseCode)) {
//         button.should('be.visible')
//               .and('be.disabled')
//               .and('contain.text', 'Reserve');
//       } else {
//         button.should('be.visible')
//               .and('be.enabled')
//               .and('contain.text', 'Reserve');
//       }
//     });

//   }
// );
