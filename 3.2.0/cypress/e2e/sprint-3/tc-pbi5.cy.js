describe(`TC-PBI5 : CHANGE-PLAN`, () => {

    Cypress.session.clearAllSavedSessions();
    
    
    it(`TC-PBI5-1 : 'Change' button – behavior`, () => {
        cy.log('===================== TC-PBI5-1 =====================');
        cy.log('>>> Test the dropdown and Change button behavior');
        cy.log('=====================================================');
        let declaredPlan = '';

        cy.log('* ');
        cy.log('* Step 0a: Must be itb-ecors public URL');
        cy.visit('');
        cy.url().then(url => cy.log('Current URL: ' + url));
        cy.url().should('match', /bscit\.sit\.kmutt\.ac\.th\/intproj25.*\/itb-ecors\//);

        cy.log('* ');
        cy.log('* Step 2: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod');
        // Intercept a GET request, send 404 response.
        // When response from server is 200 OK, store the response body in declaredPlan.
        cy.intercept({ method: 'GET', url: '**/students/67130500144/declared-plan', times: 1 }, (req) => {
            req.continue((res) => {
                if (res.statusCode === 200) declaredPlan = res.body;
                res.send({ statusCode: 404, fixture: 'declared-plan/404-s67130500144.json' });
            });
        }).as('getDeclaredPlan404');
        cy.visit('reserve.html');
        cy.wait('@getDeclaredPlan404').then(() => {
            if (declaredPlan) {;
                cy.log('Initial declaredPlan planId: ' + declaredPlan.planId + ', status: ' + declaredPlan.status);
            } else {
                cy.log('Initial declaredPlan: NOT FOUND');
            }
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 3: Declare AI - AI Developer plan');
        // If declared plan does not exists OR cancelled, declare AI plan
        // Otherwise, if declared plan is different, change declared plan to AI
        cy.then(() => {
            if (!declaredPlan || declaredPlan.status == 'CANCELLED') {
                cy.log('Since there is no declared plan or it is cancelled, declaring AI - AI Developer plan');
                cy.intercept('POST', '**/students/**').as('declarePlan');
                cy.get('.ecors-dropdown-plan').select('AI - AI Developer');
                cy.get('.ecors-button-declare').click();
                cy.wait('@declarePlan').then(({ request, response }) => {
                    expect(response.statusCode).to.equal(201);
                });
            } else if (declaredPlan && declaredPlan.status === 'DECLARED' && declaredPlan.planId !== 4) {
                cy.log('Changing declared plan to AI - AI Developer plan');
                cy.intercept('PUT', '**/students/**').as('changePlanToAI');
                cy.get('.ecors-dropdown-plan').select('AI - AI Developer');
                cy.get('.ecors-button-change').click();
                cy.wait('@changePlanToAI').then(({ request, response }) => {
                    expect(response.statusCode).to.equal(200);
                })
            } else {
                cy.log('Declared plan is already AI - AI Developer, no action needed') ;
            }
            cy.wait(Cypress.config('regularWaitMs'));
            cy.closeDialogIfPresent();

            cy.get('.ecors-declared-plan').should('contain.text', 'Declared AI - AI Developer');
            cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'AI - AI Developer');
            cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
            cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        });

        cy.log('* ');
        cy.log('* Step 4: Refresh the page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'AI - AI Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 5: Select FE - Frontend Developer');
        cy.get('.ecors-dropdown-plan').select('FE - Frontend Developer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'FE - Frontend Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 6: Un-select FE - Frontend Developer');
        cy.get('.ecors-dropdown-plan').select('');
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 7: Select AI - AI Developer');
        cy.get('.ecors-dropdown-plan').select('AI - AI Developer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'AI - AI Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
    });


    it(`TC-PBI5-2 : Change plan twice – success`, () => {
        cy.log('===================== TC-PBI5-2 =====================');
        cy.log('>>> Test changing plan twice successfully');
        cy.log('=====================================================');

        cy.signIn('67130500144', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 1: Select DB - Database Administrator');
        cy.get('.ecors-dropdown-plan').select('DB - Database Administrator');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DB - Database Administrator');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 2: Click Change button');
        // Intercept the PUT request to verify the request body and response
        cy.intercept('PUT', '**/students/67130500144/declared-plan', (req) => {
            expect(req.body).to.have.property('planId', 8);
            req.continue((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('planId', 8);
            })
        }).as('changePlan');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan');

        cy.log('* ');
        cy.log('* Step 3: Click OK to close the dialog');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration updated.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared DB - Database Administrator');
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterChange1')
            .then(text => Cypress.utils.shouldBeNow(text, { withinMs: 3000 + 2 * Cypress.config('regularWaitMs') }));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DB - Database Administrator');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 4: Select DE - Data Engineer');
        cy.get('.ecors-dropdown-plan').select('DE - Data Engineer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DE - Data Engineer');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 5: Click Change button');
        cy.intercept('PUT', '**/students/67130500144/declared-plan', (req) => {
            expect(req.body).to.have.property('planId', 7);
            req.continue((res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.have.property('planId', 7);
                expect(res.body.updatedAt).to.not.equal(res.body.createdAt);
            })
        }).as('changePlan2');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan2');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration updated.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared DE - Data Engineer');
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterChange2')
            .then(text => Cypress.utils.shouldBeNow(text, { withinMs: 3000 + 2 * Cypress.config('regularWaitMs') }));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DE - Data Engineer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 6: Refresh the page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared DE - Data Engineer');
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterReload').then(text => {
            cy.get('@statusAfterChange2').then(statusAfterChange2 => {
                expect(text, 'The status display should be the same after page reload')
                    .to.equal(statusAfterChange2);
            });
        });
    })


    it(`TC-PBI5-3 : Handle 404 Not Found when changing plan`, () => {
        cy.log('===================== TC-PBI5-3 =====================');
        cy.log('>>> Test handling 404 Not Found error when changing plan');
        cy.log('=====================================================');

        cy.log('* step 0: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 1: Select FE - Frontend Developer');
        cy.get('.ecors-dropdown-plan').select('FE - Frontend Developer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'FE - Frontend Developer');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 2: Mock a 404 Not Found response for PUT /declared-plan');
        // mock 404 response for PUT /declared-plan
        cy.intercept('PUT', '**/students/67130500144/declared-plan', (req) => {
            req.reply({ statusCode: 404, fixture: 'declared-plan/404-s67130500144.json' });
        }).as('changePlan404');
        // mock 404 response for GET /declared-plan
        cy.intercept('GET', '**/students/67130500144/declared-plan', (req) => {
            req.reply({ statusCode: 404, fixture: 'declared-plan/404-s67130500144.json' });
        }).as('getDeclaredPlan404');

        cy.log('* ');
        cy.log('* Step 3: Click Change button');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan404');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("No declared plan found for student with id=67130500144.");

        cy.log('* ');
        cy.log('* Step 4: Click OK to close the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Not Declared');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
    });


    it('TC-PBI5-4 : error case (500 and 502)', () => {
        cy.log('===================== TC-PBI5-4 =====================');
        cy.log('>>> Test handling 500 Internal Server Error and Network Error when changing plan');
        cy.log('=====================================================');

        cy.log('* ');
        cy.log('* step 1: Sign-in as 67130500140 (Somchai Jaidee)');
        cy.signIn('67130500140', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 2: Select BE - Backend Developer');
        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'BE - Backend Developer');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 3: Intercept response and reply with 500 Internal Server Error');
        cy.intercept('PUT', '**/students/67130500140/declared-plan', (req) => {
            req.reply({ statusCode: 500, fixture: 'declared-plan/500-internal-server-error.json' });
        }).as('changePlan500');

        cy.log('* ');
        cy.log('* Step 4: Click Change button');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan500');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog('There is a problem. Please try again later.');

        cy.log('* ');
        cy.log('* Step 5: Click OK in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.reload();

        cy.log('* ');
        cy.log('* Step 6: Select BE - Backend Developer');
        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'BE - Backend Developer');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');

        cy.log('* ');
        cy.log('* Step 7: Intercept response and mock network error');
        cy.intercept('PUT', '**/students/67130500140/declared-plan', (req) => {
            req.destroy();
        }).as('changePlanNetworkError');

        cy.log('* ');
        cy.log('* Step 8: Click Change button');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlanNetworkError');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog('There is a problem. Please try again later.');

        cy.log('* ');
        cy.log('* Step 9: Press ESC key in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
    });
})