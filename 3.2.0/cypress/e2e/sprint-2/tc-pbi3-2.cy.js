describe(`TC-PBI3-2 : VIEW-DECLARED PLAN\n
          normal : - no declaration`, () => {

    Cypress.session.clearAllSavedSessions() ;


    it(`[step 1] should visit /reserve.html successfully after signing in.\n`, () => {
        cy.visit('/reserve.html');
        cy.wait(Cypress.config().keycloakWaitMs) ;
        
        cy.url().should('include', Cypress.config().keycloakUrl + '/protocol/openid-connect/auth') ;
    })


    it(`[step 2] should show the fullname "Somyot Meedee" and \n
        should display "'Declaration Status: Not Declared".`,()=>{    
        cy.signIn('67130500142', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-fullname').should('exist').and('be.visible').and('contain.text','Somyot Meedee') ;
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
          .and('contain.text','Not Declared') ;
    })
})