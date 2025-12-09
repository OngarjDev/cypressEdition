describe(`TC-PBI4-4 : DECLARE-PLAN - error case (500 and 502)`, () => {

    // Cypress.session.clearAllSavedSessions();

    before(function () {
        cy.log('* ');
        cy.log('*** Extracting a baseAPI from the request URL ***');
        cy.log('*** This will be used to send /__test__/time requests ***');
        cy.intercept({ method: 'GET', url: '**/study-plans', times: 1 }).as('getStudyPlans');
        cy.visit('');
        cy.wait('@getStudyPlans').then(({ request }) => {
            Cypress.env('baseAPI', request.url.split('/study-plans')[0]);
            cy.log('Base API: ' + Cypress.env('baseAPI'));
        });
    });

    beforeEach(() => {
        const testTime = '2025-12-01T06:00:00Z';
        cy.log('* ');
        cy.log(`* Step 0: For the system that has PBI11`);
        cy.log(`* Set FE/BE clock to ${testTime}`);
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);
    });

    after(function () {
        cy.log('* ');
        cy.log('* Post-condition: Reset FE/BE clocks to real time');
        cy.log('Resetting server time');
        cy.resetServerTime();
        cy.clock().then((clock) => { clock.restore(); });
    });


    it(`[step 1–5] Should handle 500 Internal Server Error correctly 
        by showing alert/dialog that can be dismissed.`, () => {
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('------------------------------');
        cy.log(' Stub a response that returns 500 Internal Server Error');
        cy.log('------------------------------');

        cy.intercept('POST', '**/students/**', (req) => {
            req.reply({ statusCode: 500, fixture: 'declared-plan/500-internal-server-error.json' });
        }).as('request');

        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.get('.ecors-button-declare').click();
        cy.wait('@request')

        cy.log('------------------------------');
        cy.log(' Verify that the appropriate alert/dialog is shown ');
        cy.log(' and can be dismissed with OK button.');
        cy.log('------------------------------');

        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("There is a problem. Please try again later.");

        // Dismiss the alert/dialog and verify it is closed
        cy.closeDialogIfPresent();
        cy.shouldCloseDialog();
    })


    it(`[step 6–8] Should handle Network Error correctly 
        by showing alert/dialog that can be dismissed.`, () => {
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('------------------------------');
        cy.log(' Stub a network error (e.g., server is down)');
        cy.log('------------------------------');

        cy.intercept('POST', '**/students/**', (req) => {
            req.destroy();
        }).as('request');

        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.get('.ecors-button-declare').click();
        cy.wait('@request')

        cy.log('------------------------------');
        cy.log(' Verify that the appropriate alert/dialog is shown ');
        cy.log(' and can be dismissed with ESC key.');
        cy.log('------------------------------');

        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("There is a problem. Please try again later.");
        // Dismiss the alert/dialog and verify it is closed
        cy.closeDialogIfPresent();
        cy.shouldCloseDialog();
    })
})