describe(`TC-PBI4-1 : DECLARE-PLAN\n
          normal : - test 'Declare' button enable/disable logic`, () => {

    Cypress.session.clearAllSavedSessions();

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


    it(`[step 1] should have a dropdown to select a study plan and should show drop-down list with 9 study plans.\n
        should not select any plan by default.\n
        should disable the 'Declare' button by default.`, () => {
        cy.signIn('67130500142', 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.get('.ecors-dropdown-plan').should('exist').and('be.visible');
        cy.fixture('study-plans/expected.json').then(expected =>
            cy.get('.ecors-plan-row')
                .should('have.length', expected.length)
                .then($rows => {
                    const actual = [...$rows].map(row => row.innerText.trim());
                    expect(actual).to.deep.equal(expected);
                })
        );

        // By default, no plan is selected
        cy.get('.ecors-dropdown-plan option:selected').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
    })

    it(`[step 2 and 3] should select a 'UX - UX/UI Designer' from the dropdown and enable the 'Declare' button.
        When un-select, should disable the 'Declare' button.`, () => {
        cy.signIn('67130500142', 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.get('.ecors-dropdown-plan').select('UX - UX/UI Designer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text', 'UX - UX/UI Designer');
        cy.shouldBeVisibleAndClickable('.ecors-button-declare');

        cy.get('.ecors-dropdown-plan').select('');
        cy.get('.ecors-dropdown-plan option:selected').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
    })
})