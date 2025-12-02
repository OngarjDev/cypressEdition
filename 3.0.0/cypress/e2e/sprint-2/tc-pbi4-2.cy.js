describe(`TC-PBI4-2 : DECLARE-PLAN\n
          normal : - successful declare`, () => {
            
    Cypress.session.clearAllSavedSessions() ;


    it(`[step 1–3] should successfully declare a study plan 
        , update the status display correctly after declaration,
        and show the same status display after reload`,()=>{    
        cy.signIn('67130500142', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.log('------------------------------') ;
        cy.log('step 1: Select DS - Data Scientist') ;
        cy.log('------------------------------') ;

        cy.get('.ecors-dropdown-plan').select('DS - Data Scientist') ;
        cy.get('.ecors-dropdown-plan').should('contain.text','DS - Data Scientist'); 
        cy.get('.ecors-button-declare').should('exist').and('be.visible').and('be.enabled') ;
        
        cy.log('------------------------------') ;
        cy.log('step 2: Declare the selected plan') ;
        cy.log('declared status should be updated to DS - Data Scientist automatically') ;
        cy.log('and the Declare button is hidden.') ;
        cy.log('------------------------------') ;

        // Intercept the POST request to verify the request body and response
        cy.intercept('POST', '**/students/**', (req) => {
            expect(req.body).to.have.property('planId', 5) ;
            req.continue((res) => {
                expect(res.statusCode).to.equal(201) ;
                expect(res.body).to.have.property('planId', 5) ;
                expect(res.body).to.have.property('updatedAt') ;
            })
        }).as('declarePlan') ;
        cy.get('.ecors-button-declare').click() ;

        // Wait for the intercepted request to complete and verify the updated declaration status
        // and the 'Declare' button is hidden after declaration
        cy.wait('@declarePlan') ;       
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
          .and('contain.text','Declared DS - Data Scientist');
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterDeclare').then( text => Cypress.utils.shouldBeNow(text)) ;
        cy.get('.ecors-button-declare').should('exist').and('not.be.visible') ;

        cy.log('------------------------------') ;
        cy.log('step 3: Verify the declaration status after reload') ;
        cy.log('it should be the same as after declaration') ;
        cy.log('------------------------------') ;

        // Refresh the page and verify the declaration status is the same after reload
        cy.reload() ;
        cy.get('.ecors-declared-plan').should('exist').and('be.visible') ;
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterReload') ;
        cy.get('@statusAfterDeclare').then( statusAfterDeclare => {
            cy.get('@statusAfterReload').then( statusAfterReload => {
                expect(statusAfterReload, 'The status display should be the same after page reload')
                  .to.equal(statusAfterDeclare) ;
            });
        });
        cy.get('.ecors-button-declare').should('exist').and('not.be.visible') ;
    });
})