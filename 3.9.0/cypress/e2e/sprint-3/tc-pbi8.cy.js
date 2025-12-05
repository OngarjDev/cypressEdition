describe(`PBI8 : SECURE-CONNECTION'`, () => {

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
    

    it(`Pre-condition: Must be itb-ecors public URL`, () => {
        cy.log('=====================================================');
        cy.log('>>> Pre-condition: Must be itb-ecors public URL');
        cy.log('=====================================================');
        cy.visit('');
        cy.url({timeout: 300}).then(url => {
            cy.log('Current URL: ' + url);
            expect(url).to.match(/bscit\.sit\.kmutt\.ac\.th\/intproj25.*\/itb-ecors\//);
        });
    });


    it(`TC-PBI8-1 : SECURE-CONNECTION - Test CRUD operations over secure connection (HTTPS)`, () => {
        cy.log('===================== TC-PBI8-1 =====================');
        cy.log('>>> Test CRUD operations over secure connection (HTTPS)');
        cy.log('=====================================================');

        cy.log('* ');
        cy.log('* Step 1: Make sure the connection is secure (HTTPS)');
        cy.visit('');
        cy.location('protocol').should('eq', 'https:');
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('/reserve.html');
        cy.location('protocol').should('eq', 'https:');

        cy.log('* ');
        cy.log('* Step 2: Perform GET declared plan over HTTPS. Cancel a plan if exists.');
        cy.intercept('GET', '**/students/67130500144/declared-plan').as('getDeclaredPlanHTTPS');
        cy.reload();
        cy.wait('@getDeclaredPlanHTTPS').then(({ request, response }) => {
            cy.wait(Cypress.config('regularWaitMs'));
            expect(request.url).to.include('https://');
            if (response.statusCode === 200 && response.body.status === 'DECLARED') {
                cy.log('A declared plan exists. Cancel it first.');
                cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
                cy.wait(Cypress.config('dialogWaitMs'));
                cy.get('.ecors-dialog .ecors-button-cancel').click();
                cy.wait(Cypress.config('regularWaitMs'));
                cy.closeDialogIfPresent();
            }
        });

        cy.log('* ');
        cy.log('* Step 3: Declare a plan over HTTPS');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('exist').and('be.visible').invoke('text')
            .then(text => {
                expect(text).to.satisfy(t => t.includes('Not Declared')
                    || t.includes('Cancelled'));
            });
        cy.get('.ecors-dropdown-plan option:selected').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
        cy.get('.ecors-dropdown-plan').select('UX - UX/UI Designer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text', 'UX - UX/UI Designer');
        cy.shouldBeVisibleAndClickable('.ecors-button-declare');
        cy.get('.ecors-button-declare').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared UX - UX/UI Designer')
            .invoke('text').as('StatusAfterDeclare')
            .then(text => Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') }));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text', 'UX - UX/UI Designer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel');

        cy.log('* ');
        cy.log('* Step 4: Perform PUT a declared plan over HTTPS');
        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');
        cy.get('.ecors-button-change').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration updated.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared BE - Backend Developer')
            .invoke('text').as('statusAfterChange1')
            .then(text => Cypress.utils.shouldBeNow(text, { withinMs: 3000 + 2 * Cypress.config('regularWaitMs') }));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text', 'BE - Backend Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel');

        cy.log('* ');
        cy.log('* Step 5: Perform DELETE a declared plan over HTTPS');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration cancelled.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Cancelled BE - Backend Developer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan option:selected').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    })
})