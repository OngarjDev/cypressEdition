describe(`TC-PBI4-1 : DECLARE-PLAN\n
          normal : - test 'Declare' button enable/disable logic`, () => {

    Cypress.session.clearAllSavedSessions();


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