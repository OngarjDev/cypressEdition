describe(`TC-PBI4-3 : DECLARE-PLAN\n
          normal : - declare twice using two browser tabs`, () => {

    Cypress.session.clearAllSavedSessions() ;


    it(`Should handle 409 Conflict correctly by showing alert/dialog 
        and updating the declaration status automatically. 
        Hide the 'Declare' button when status is declared.`, ()=>{
            
        cy.signIn('67130500143', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;
        
        cy.log('------------------------------') ;
        cy.log(' Stub a response that returns 409 Conflict') ;
        cy.log(' But still send POST request to the backend server') ;
        cy.log('------------------------------') ;

        cy.intercept('POST', '**/students/**', (req) => {
            req.continue((res) => {
                res.send({
                    statusCode: 409,
                    body: {"error": "ALREADY_DECLARED", 
                        "message": "A declaration already exists for this student."}
                    }) ;
                })
            }).as('declarePlan') ;

        cy.get('.ecors-dropdown-plan').select('UX - UX/UI Designer') ;
        cy.get('.ecors-button-declare').click() ;
            
        // Wait for the intercepted request to complete and verify the frontend handle of the 409 response
        cy.wait('@declarePlan') ;

        cy.log('------------------------------') ;
        cy.log(' Verify that the appropriate alert/dialog is shown to the user.') ;
        cy.log('------------------------------') ;

        let alertShown = false;
        let alertText = '';
        
        cy.on('window:alert', (msg) => {
            alertShown = true;
            alertText = msg;                    
        });

        const expectedAlertMessage = 'You may have declared study plan already. Please check again.';

        cy.then(() => {
            if (alertShown) {
                expect(alertText).to.equal(expectedAlertMessage);
            } else {
                cy.get('.ecors-dialog').should('be.visible') ;
                cy.get('.ecors-dialog .ecors-dialog-message').should('have.text', expectedAlertMessage) ;
                cy.contains('.ecors-dialog .ecors-button-dialog', /^ok$/i).should('be.visible').click();
            }
        });

        cy.log('------------------------------') ;
        cy.log(' Verify that the declartion status is updated to UX - UX/UI Designer automatically.') ;
        cy.log(' The updatedAt time is about now and the Declare button is hidden.') ;
        cy.log('------------------------------') ;

        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
          .and('contain.text','Declared UX - UX/UI Designer');
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterDeclare').then( text => Cypress.utils.shouldBeNow(text, {withinMs: 3000})) ;
        cy.get('.ecors-button-declare').should('exist').and('not.be.visible') ;

        cy.log('------------------------------') ;
        cy.log(' Verify the declaration status after reload') ;
        cy.log('------------------------------') ;

        // Refresh the page and verify the declaration status is the same after reload
        cy.reload() ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-declared-plan').should('exist').and('be.visible') ;
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterReload') ;
        cy.get('@statusAfterDeclare').then( statusAfterDeclare => {
            cy.get('@statusAfterReload').then( statusAfterReload => {
                expect(statusAfterReload, 'The status display should be the same after page reload')
                  .to.equal(statusAfterDeclare) ;
            });
        });
        cy.get('.ecors-button-declare').should('exist').and('not.be.visible') ;
    })    

})