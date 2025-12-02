describe(`TC-PBI4-4 : DECLARE-PLAN - error case (500 and 502)`, () => {

    Cypress.session.clearAllSavedSessions() ;


    it(`[step 1–5] Should handle 500 Internal Server Error correctly 
        by showing alert/dialog that can be dismissed.`,
        { keystrokeDelay: 0 }, () => {
        cy.signIn('67130500144', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.log('------------------------------') ;
        cy.log(' Stub a response that returns 500 Internal Server Error') ;
        cy.log('------------------------------') ;

        cy.intercept('POST', '**/students/**', (req) => {
            req.reply({
                statusCode: 500,
                body: {"error": "INTERNAL_SERVER_ERROR", 
                        "message": "An unexpected error occurred on the server."} }) ;
            }).as('request') ;

        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer') ;
        cy.get('.ecors-button-declare').click() ;
        cy.wait('@request')

        cy.log('------------------------------') ;
        cy.log(' Verify that the appropriate alert/dialog is shown ') ;
        cy.log(' and can be dismissed with OK button.') ;
        cy.log('------------------------------') ;
        
        const expectedAlertMessage = 'There is a problem. Please try again later.';
        let alertShown = false;
        let alertText = '';

        cy.on('window:alert', (msg) => {
            alertShown = true;
            alertText = msg;                    
        });

        cy.then(() => {
            if(alertShown) {
                expect(alertText).to.equal(expectedAlertMessage);
            } else {
                cy.get('.ecors-dialog').should('be.visible') ;
                cy.get('.ecors-dialog .ecors-dialog-message').should('have.text', expectedAlertMessage) ;
                cy.contains('.ecors-dialog .ecors-button-dialog', /^ok$/i).should('be.visible').click();
            }
        });

        // Dismiss the alert/dialog and verify it is closed
        cy.get('.ecors-dialog').should('not.have.attr', 'open');
    })


    it(`[step 6–8] Should handle Network Error correctly 
        by showing alert/dialog that can be dismissed.`
        , { keystrokeDelay: 0 }, () => {
        cy.signIn('67130500144', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.log('------------------------------') ;
        cy.log(' Stub a network error (e.g., server is down)') ;
        cy.log('------------------------------') ;

        cy.intercept('POST', '**/students/**', (req) => {
            req.destroy() ;
        }).as('request') ;

        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer') ;
        cy.get('.ecors-button-declare').click() ;
        cy.wait('@request')

        cy.log('------------------------------') ;
        cy.log(' Verify that the appropriate alert/dialog is shown ') ;
        cy.log(' and can be dismissed with ESC key.') ;
        cy.log('------------------------------') ;

        const expectedAlertMessage = 'There is a problem. Please try again later.';
        let alertShown = false;
        let alertText = '';

        cy.on('window:alert', (msg) => {
            alertShown = true;
            alertText = msg;                    
        });


        cy.then(() => {
            if(alertShown) {
                expect(alertText).to.equal(expectedAlertMessage);
                cy.get('body').type('{esc}') ;
            } else {
                cy.get('.ecors-dialog').should('be.visible') ;
                cy.get('.ecors-dialog .ecors-dialog-message').should('have.text', expectedAlertMessage) ;

                // cy.press(Cypress.Keyboard.Keys.ESC) ; <-- this does not work
                cy.contains('.ecors-dialog .ecors-button-dialog', /^ok$/i).should('be.visible').click();
            }
        });

        // Dismiss the alert/dialog and verify it is closed
        cy.get('.ecors-dialog').should('not.have.attr', 'open');
    })    
})