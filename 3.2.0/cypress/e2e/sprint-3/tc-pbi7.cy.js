describe(`TC-PBI7 : SHOW-LAST-PLAN-CANCELLATION`, () => {

    Cypress.session.clearAllSavedSessions();


    it(`TC-PBI7-1 : normal
        • Cancel Declaration button – behavior
        • Cancellation dialog – behavior
        • Cancel declaration – success`, () => {

        let declaredPlan = '';

        cy.log('===================== TC-PBI7-1 =====================');
        cy.log('>>> Test button and dialog behavior, and successful plan cancellation');
        cy.log('=====================================================');

        cy.log('* ');
        cy.log('* Step 0: Must be itb-ecors public URL');
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
            if (declaredPlan) {
                ;
                cy.log('Initial declaredPlan planId: ' + declaredPlan.planId + ', status: ' + declaredPlan.status);
            } else {
                cy.log('Initial declaredPlan: NOT FOUND');
            }
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 3: Declare DE - Data Engineer plan');
        // If declared plan does not exists OR cancelled, declare DE plan
        // Otherwise, if declared plan is different, change declared plan to DE
        cy.then(() => {
            if (!declaredPlan || declaredPlan.status === 'CANCELLED') {
                cy.log('Since there is no declared plan or it is cancelled, declaring DE - Data Engineer plan');
                cy.intercept('POST', '**/students/**').as('declarePlan');
                cy.get('.ecors-dropdown-plan').select('DE - Data Engineer');
                cy.get('.ecors-button-declare').click();
                cy.wait('@declarePlan').then(({ request, response }) => {
                    expect(response.statusCode).to.equal(201);
                });
            } else if (declaredPlan && declaredPlan.status === 'DECLARED' && declaredPlan.planId !== 7) {
                cy.log('Changing declared plan to DE - Data Engineer');
                cy.intercept('PUT', '**/students/**').as('changePlan');
                cy.get('.ecors-dropdown-plan').select('DE - Data Engineer');
                cy.get('.ecors-button-change').click();
                cy.wait('@changePlan').then(({ request, response }) => {
                    expect(response.statusCode).to.equal(200);
                });
            } else {
                cy.log('Declared plan is already DE - Data Engineer, no action needed');
            }
            cy.wait(Cypress.config('regularWaitMs'));
            cy.closeDialogIfPresent();

            cy.get('.ecors-declared-plan').should('contain.text', 'Declared DE - Data Engineer');
            cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DE - Data Engineer');
            cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
            cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
            cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
        });

        cy.log('* ');
        cy.log('* Step 5: Click Cancel Declaration button');
        cy.get('.ecors-declared-plan').invoke('text').as('StatusBeforeCancel').then(text => {
            const displayedTime = Cypress.utils.getDisplayedTimeFromText(text);
            cy.wait(Cypress.config('dialogWaitMs'));
            cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
            cy.shouldShowDialog(`You have declared DE - Data Engineer as your plan on ${displayedTime[0]} (Asia/Bangkok). Are you sure you want to cancel this declaration?`);
        });

        cy.log('* ');
        cy.log('* Step 6: Click Keep Declaration button');
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-button-keep').should('contain.text', 'Keep Declaration').click();
        cy.shouldCloseDialog();
        cy.get('.ecors-declared-plan').invoke('text').as('StatusAfterKeep').then(text => {
            cy.get('@StatusBeforeCancel').then(statusBeforeCancel => {
                expect(text, 'The status display should be the same after keeping declaration')
                    .to.equal(statusBeforeCancel);
            });
        });
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 7-8: Click Cancel Declaration button twice');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').should('contain.text', 'Cancel Declaration').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration cancelled.");

        cy.log('* ');
        cy.log('* Step 9: click OK in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').as('StatusAfterCancel').then(text => {
            expect(text).to.includes('Cancelled DE - Data Engineer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 10: Refresh the page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').as('StatusAfterReload').then(text => {
            cy.get('@StatusAfterCancel').then(statusAfterCancel => {
                expect(text, 'The status display should be the same after page reload')
                    .to.equal(statusAfterCancel);
            });
        });
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it('TC-PBI7-2 : Handles 409 error when cancel plan', () => {
        cy.log('===================== TC-PBI7-2 =====================');
        cy.log('>>> Test handling 409 Conflict error when canceling plan');
        cy.log('=====================================================');

        cy.log('* step 0a: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 0b: Grab current status text');
        cy.get('.ecors-declared-plan').invoke('text').as('StatusBeforeCancel409')

        cy.log('* ');
        cy.log('* Step 0c: Mock /declared-plan GET to return declared plan AI - AI Developer');
        cy.intercept({ method: 'GET', url: '**/students/67130500144/declared-plan', times: 1 }, (req) => {
            req.reply({
                statusCode: 200,
                fixture: 'declared-plan/200-s67130500144-ai.json'
            })
        }).as('mockGetDeclaredPlan');
        cy.reload();
        cy.wait('@mockGetDeclaredPlan');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 1: Click Cancel Declaration button twice');
        cy.intercept('DELETE', '**/students/**').as('cancelPlan');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@cancelPlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(409);
            cy.fixture('declared-plan/409-cancelled-delete.json').then(expected => {
              expect(response.body).to.includes(expected)});
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Cannot cancel the declared plan because it is already cancelled.");

        cy.log('* ');
        cy.log('* Step 2: click OK in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').as('StatusAfterCancel409').then(text => {
            cy.get('@StatusBeforeCancel409').then(statusBeforeCancel409 => {
                expect(text, 'The status display should be the same after 409 error on canceling')
                    .to.equal(statusBeforeCancel409);
            });
        });
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it('TC-PBI7-3 : Handles 409 error when change plan', () => {
        cy.log('===================== TC-PBI7-3 =====================');
        cy.log('>>> Test handling 409 Conflict error when changing plan');
        cy.log('=====================================================');

        cy.log('* step 0a: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 0b: Grab current status text');
        cy.get('.ecors-declared-plan').invoke('text').as('StatusBeforeChange409')

        cy.log('* ');
        cy.log('* Step 0c: Mock /declared-plan GET to return declared plan AI - AI Developer');
        cy.intercept({ method: 'GET', url: '**/students/67130500144/declared-plan', times: 1 }, (req) => {
            req.reply({
                statusCode: 200,
                fixture: 'declared-plan/200-s67130500144-ai.json'
            })
        }).as('mockGetDeclaredPlan');
        cy.reload();
        cy.wait('@mockGetDeclaredPlan');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 1: Select DS - Data Scientist');
        cy.get('.ecors-dropdown-plan').select('DS - Data Scientist');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DS - Data Scientist');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 1: Click Change button');
        cy.intercept('PUT', '**/students/**').as('changePlan');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(409);
            cy.fixture('declared-plan/409-cancelled-put.json').then(expected => {
              expect(response.body).to.includes(expected)});
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Cannot update the declared plan because it has been cancelled.");

        cy.log('* ');
        cy.log('* Step 2: click OK in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').as('StatusAfterChange409').then(text => {
            cy.get('@StatusBeforeChange409').then(statusBeforeChange409 => {
                expect(text, 'The status display should be the same after 409 error on changing')
                    .to.equal(statusBeforeChange409);
            });
        });
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it('TC-PBI7-4 : normal • Declaration section – behavior • Declare plan again – success', () => {
        cy.log('===================== TC-PBI7-4 =====================');
        cy.log('>>> Test declaration section behavior and successful plan declaration after cancellation');
        cy.log('=====================================================');

        cy.log('* step 0: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 1: Select DE - Data Engineer');
        cy.get('.ecors-dropdown-plan').select('DE - Data Engineer');
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DE - Data Engineer');
        cy.shouldBeVisibleAndClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 2: Click Declare button');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-button-declare').click();
        cy.wait('@declarePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
            expect(response.body.planId).to.equal(7);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Declared DE - Data Engineer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DE - Data Engineer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it(`TC-PBI7-5 : Handle 404 Not Found when cancel plan`, () => {
        cy.log('===================== TC-PBI7-5 =====================');
        cy.log('>>> Test handling 404 Not Found error when canceling plan');
        cy.log('=====================================================');

        cy.log('* step 0: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 0: Mock /declared-plan GET to return declared plan AI - AI Developer');
        cy.intercept({ method: 'GET', url: '**/students/67130500144/declared-plan', times: 1 }, (req) => {
            req.reply({
                statusCode: 200,
                fixture: 'declared-plan/200-s67130500144-ai.json'
            })
        }).as('mockGetDeclaredPlan');
        cy.reload();
        cy.wait('@mockGetDeclaredPlan');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 1: Mock a 404 Not Found response for DELETE /declared-plan');
        cy.intercept('DELETE', '**/students/67130500144/declared-plan', (req) => {
            req.reply({ statusCode: 404, fixture: 'declared-plan/404-s67130500144.json' });
        }).as('cancelPlan404');
        // mock 404 response for GET /declared-plan
        cy.intercept('GET', '**/students/67130500144/declared-plan', (req) => {
            req.reply({ statusCode: 404, fixture: 'declared-plan/404-s67130500144.json' });
        }).as('getDeclaredPlan404');

        cy.log('* ');
        cy.log('* Step 1: Click Cancel button');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@cancelPlan404');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("No declared plan found for student with id=67130500144.");

        cy.log('* ');
        cy.log('* Step 2: Click OK to close the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Not Declared');
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it('TC-PBI7-6 : error case (500 and 502)', () => {
        cy.log('===================== TC-PBI7-6 =====================');
        cy.log('>>> Test handling 500 Internal Server Error and Network Error when cancelling plan');
        cy.log('=====================================================');

        cy.log('* ');
        cy.log('* step 1: Sign-in as 67130500140 (Somchai Jaidee)');
        cy.signIn('67130500140', 'itbangmod');
        cy.visit('reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 3: Intercept response and reply with 500 Internal Server Error');
        cy.intercept('DELETE', '**/students/67130500140/declared-plan', (req) => {
            req.reply({ statusCode: 500, fixture: 'declared-plan/500-internal-server-error.json' });
        }).as('cancelPlan500');

        cy.log('* ');
        cy.log('* Step 4: Click Change button');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@cancelPlan500');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog('There is a problem. Please try again later.');

        cy.log('* ');
        cy.log('* Step 5: Click OK in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.reload();

        cy.log('* ');
        cy.log('* Step 7: Intercept response and mock network error');
        cy.intercept('DELETE', '**/students/67130500140/declared-plan', (req) => {
            req.destroy();
        }).as('cancelPlanNetworkError');

        cy.log('* ');
        cy.log('* Step 8: Click Change button');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@cancelPlanNetworkError');
        cy.shouldShowDialog('There is a problem. Please try again later.');

        cy.log('* ');
        cy.log('* Step 9: Press ESC key in the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
    });
});