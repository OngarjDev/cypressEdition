describe(`TC-PBI6 : CANCEL-PLAN`, () => {

    Cypress.session.clearAllSavedSessions() ;

    
    it(`TC-PBI6-1 : normal
        • Cancel Declaration button – behavior
        • Cancellation dialog – behavior
        • Cancel declaration – success`,()=>{    
        
        let declaredPlan = '' ;

        cy.log('===================== TC-PBI6-1 =====================') ;
        cy.log('>>> Test button and dialog behavior, and successful plan cancellation') ;
        cy.log('=====================================================') ;

        cy.log('* ') ;
        cy.log('* Step 0: Must be itb-ecors public URL') ;
            cy.visit('') ;
            cy.url().then(url => cy.log('Current URL: ' + url)) ;
            cy.url().should('match', /bscit\.sit\.kmutt\.ac\.th\/intproj25.*\/itb-ecors\//) ;

        cy.log('* ') ;
        cy.log('* Step 2: Sign-in as 67130500144 (Sompong Pordee)');
            cy.signIn('67130500144', 'itbangmod') ;
            // send a request, mock 404 when getting 200 to test cancel buttton
            cy.intercept({method: 'GET', url: '**/students/67130500144/declared-plan', times: 1}, (req) => {
                req.continue((res) => {
                    if (res.statusCode === 200) {
                        declaredPlan = res.body;
                        res.send({statusCode: 404}) ; } });
            }).as('getDeclaredPlan404') ;
            cy.visit('reserve.html') ;
            cy.wait('@getDeclaredPlan404') ;
            cy.wait(Cypress.config('regularWaitMs')) ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-change') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;
            cy.reload() ;
            cy.wait(Cypress.config('regularWaitMs')) ;
        
        cy.log('* ') ;
        cy.log('* Step 3: Declare DE - Data Engineer plan');
            // If declared plan does not exists OR cancelled, declare plan again
            cy.then(() => {
                cy.log('Current declaredPlan: ' + JSON.stringify(declaredPlan)) ;
                if (!declaredPlan || declaredPlan.status == 'CANCELLED') {
                    cy.intercept('POST', '**/students/**').as('declarePlan');
                    cy.get('.ecors-dropdown-plan').select('DE - Data Engineer');
                    cy.get('.ecors-button-declare').click();
                    cy.wait('@declarePlan').then(({ request, response }) => {
                        expect(response.statusCode).to.equal(201);
                        declaredPlan = response.body;
                    });
                    cy.wait(Cypress.config('regularWaitMs')) ;
                }
                cy.get('.ecors-declared-plan').should('contain.text','Declared DE - Data Engineer');
                cy.get('.ecors-dropdown-plan').should('contain.text','DE - Data Engineer') ;
                cy.shouldBeHiddenOrNotExist('.ecors-button-declare') ;
                cy.shouldBeVisibleAndNotClickable('.ecors-button-change') ;
                cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;
            }) ;
        
        cy.log('* ') ;
        cy.log('* Step 5: Click Cancel Declaration button') ;        
            let displayedTime = '' ;
            cy.get('.ecors-declared-plan').invoke('text').as('StatusBeforeCancel').then( text => {
                displayedTime = Cypress.utils.getDisplayedTimeFromText(text) ;
                cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click() ;
                cy.shouldShowDialog(`You have declared DE - Data Engineer as your plan on ${displayedTime[0]} (Asia/Bangkok). Are you sure you want to cancel this declaration?`) ;
            }) ;
            
        cy.log('* ') ;
        cy.log('* Step 6: Click Keep Declaration button') ;
            cy.get('.ecors-button-keep').should('contain.text','Keep Declaration').click() ;
            cy.shouldCloseDialog() ;
            cy.get('.ecors-declared-plan').invoke('text').as('StatusAfterKeep').then( text => {
                cy.get('@StatusBeforeCancel').then( statusBeforeCancel => {
                    expect(text, 'The status display should be the same after keeping declaration')
                      .to.equal(statusBeforeCancel) ;
                });
            }) ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-declare') ;
            cy.shouldBeVisibleAndNotClickable('.ecors-button-change') ;
            cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;
            
        cy.log('* ') ;
        cy.log('* Step 7-8: Click Cancel Declaration button twice') ;
            cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click() ;
            // cy.shouldShowDialog(`You have declared DE - Data Engineer as your plan on ${displayedTime} (Asia/Bangkok). Are you sure you want to cancel this declaration?`) ;
            cy.get('.ecors-dialog .ecors-button-cancel').should('contain.text','Cancel Declaration').click() ;
            cy.wait(Cypress.config('regularWaitMs')) ;
            cy.shouldShowDialog("Declaration cancelled.") ;

        cy.log('* ') ;
        cy.log('* Step 9: click OK in the dialog') ;
            cy.get('.ecors-button-dialog').click() ;
            cy.wait(Cypress.config('regularWaitMs')) ;
            cy.get('.ecors-declared-plan').invoke('text').then (text => {
                expect(text).to.satisfy(t => t.includes('Not Declared') || t.includes('Cancelled DE - Data Engineer'));
            });
            cy.get('.ecors-dropdown-plan').should('have.value','') ;
            cy.shouldBeVisibleAndNotClickable('.ecors-button-declare') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-change') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;

        cy.log('* ') ;
        cy.log('* Step 10: Refresh the page') ;
            cy.reload() ;
            cy.wait(Cypress.config('regularWaitMs')) ;
            cy.get('.ecors-declared-plan').invoke('text').then (text => {
                expect(text).to.satisfy(t => t.includes('Not Declared') || t.includes('Cancelled DE - Data Engineer'));
            });
            cy.shouldBeVisibleAndNotClickable('.ecors-button-declare') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-change') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;
    });


    it(`TC-PBI6-2 : Handle 404 Not Found when cancel plan`,()=>{    
        cy.log('===================== TC-PBI6-2 =====================') ;
        cy.log('>>> Test handling 404 Not Found error when canceling plan') ;
        cy.log('=====================================================') ;

        cy.log('* step 0: Sign-in as 67130500144 (Sompong Pordee)');
        cy.signIn('67130500144', 'itbangmod') ;
        cy.visit('reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.log('* ') ;
        cy.log('* Step 0: Mock /declared-plan GET to return declared plan FE - Frontend Developer') ;
            cy.intercept({method:'GET', url:'**/students/67130500144/declared-plan', times:1}, (req) => {
                req.reply({
                    statusCode: 200,
                    body: { "studentId": "67130500144", "planId": 1, "status": "DECLARED", "createdAt": "2024-01-15T10:00:00Z", "updatedAt": "2024-01-15T10:00:00Z"}
                })}).as('mockGetDeclaredPlan') ;
            cy.reload() ;
            cy.wait('@mockGetDeclaredPlan') ;
            cy.wait(Cypress.config('regularWaitMs')) ;
        
        cy.log('* ') ;
        cy.log('* Step 1: Mock a 404 Not Found response for DELETE /declared-plan') ;
            cy.intercept('DELETE', '**/students/67130500144/declared-plan', (req) => {
                req.reply({
                    statusCode: 404,
                    body: {"error": "DECLARED_PLAN_NOT_FOUND", 
                        "message": "No declared plan found for student with id=67130500144."}
                    }) ;
            }).as('cancelPlan404') ;
            // mock 404 response for GET /declared-plan
            cy.intercept('GET', '**/students/67130500144/declared-plan', (req) => {
                req.reply({
                    statusCode: 404,
                    body: {"error": "DECLARED_PLAN_NOT_FOUND", 
                        "message": "No declared plan found for student with id=67130500144."}
                    }) ;
            }).as('getDeclaredPlan404') ;

        cy.log('* ') ;
        cy.log('* Step 1: Click Cancel button') ;
            cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click() ;
            cy.get('.ecors-dialog .ecors-button-cancel').click() ;
            cy.wait('@cancelPlan404') ;
            cy.shouldShowDialog("No declared plan found for student with id=67130500144.");

        cy.log('* ') ;
        cy.log('* Step 2: Click OK to close the dialog') ;
            cy.get('.ecors-button-dialog').click();
            cy.wait(Cypress.config('regularWaitMs')) ;
            cy.get('.ecors-declared-plan').should('contain.text','Not Declared');
            cy.get('.ecors-dropdown-plan').should('have.value','') ;
            cy.shouldBeVisibleAndNotClickable('.ecors-button-declare') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-change') ;
            cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;
    });


        it('TC-PBI6-3 : error case (500 and 502)',()=>{
        cy.log('===================== TC-PBI6-3 =====================') ;
        cy.log('>>> Test handling 500 Internal Server Error and Network Error when cancelling plan') ;
        cy.log('=====================================================') ;

        cy.log('* ') ;
        cy.log('* step 1: Sign-in as 67130500140 (Somchai Jaidee)');
        cy.signIn('67130500140', 'itbangmod') ;
        cy.visit('reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.log('* ') ;
        cy.log('* Step 2: Select BE - Backend Developer') ;
            cy.get('.ecors-dropdown-plan').select('BE - Backend Developer') ;
            cy.get('.ecors-dropdown-plan').should('contain.text','BE - Backend Developer') ; 
            cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;

        cy.log('* ') ;
        cy.log('* Step 3: Intercept response and reply with 500 Internal Server Error') ;
            cy.intercept('DELETE', '**/students/67130500140/declared-plan', (req) => {
                req.reply({
                    statusCode: 500,
                    body: {"error": "INTERNAL_SERVER_ERROR", 
                            "message": "An unexpected error occurred on the server."} }) ;
                }).as('cancelPlan500') ;
                
        cy.log('* ') ;
        cy.log('* Step 4: Click Change button') ;
            cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click() ;
            cy.get('.ecors-dialog .ecors-button-cancel').click() ;
            cy.wait('@cancelPlan500') ;
            cy.shouldShowDialog('There is a problem. Please try again later.') ;

        cy.log('* ') ;
        cy.log('* Step 5: Click OK in the dialog') ;
            cy.get('.ecors-button-dialog').click();
            cy.shouldCloseDialog() ;
            cy.reload() ;

        cy.log('* ') ;
        cy.log('* Step 6: Select BE - Backend Developer') ;
            cy.get('.ecors-dropdown-plan').select('BE - Backend Developer') ;   
            cy.get('.ecors-dropdown-plan').should('contain.text','BE - Backend Developer') ; 
            cy.shouldBeVisibleAndClickable('.ecors-button-change') ;

        cy.log('* ') ;
        cy.log('* Step 7: Intercept response and mock network error') ;
            cy.intercept('DELETE', '**/students/67130500140/declared-plan', (req) => {
                req.destroy() ;
            }).as('cancelPlanNetworkError') ;
            
        cy.log('* ') ;
        cy.log('* Step 8: Click Change button') ;
            cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click() ;
            cy.get('.ecors-dialog .ecors-button-cancel').click() ;
            cy.wait('@cancelPlanNetworkError') ;
            cy.shouldShowDialog('There is a problem. Please try again later.') ;

        cy.log('* ') ;
        cy.log('* Step 9: Press ESC key in the dialog') ;
            cy.get('.ecors-button-dialog').click();
            cy.shouldCloseDialog() ;
    });
});
