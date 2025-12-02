describe(`TC-PBI3-1 : VIEW-DECLARED PLAN\n
          normal : - has declartion\n
                   - use local timestamp`, () => {

    Cypress.session.clearAllSavedSessions() ;


    it(`[step 1] should visit /reserve.html successfully after signing in.\n`, () => {
        cy.visit('/reserve.html');
        cy.wait(Cypress.config().keycloakWaitMs) ;
        
        cy.url().should('include', Cypress.config().keycloakUrl + '/protocol/openid-connect/auth') ;
    })


    it(`[step 2] should show the fullname "Somchai Jaidee" and \n
        should display "'Declaration Status: Declared FS - Full-Stack Developer plan on 11/11/2025, 00:18:19 (Asia/Bangkok)".`, ()=>{
            
        cy.setTimezone("Asia/Bangkok") 
        cy.signIn('67130500140', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-fullname').should('exist').and('be.visible').and('contain.text','Somchai Jaidee') ;

        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
          .and('contain.text','Declared FS - Full-Stack Developer')
          .and('contain.text','on 11/11/2025, 00:18:19 (Asia/Bangkok)')
    })


    it(`[step 3 and 4] show display "Declaration Status: Declared FS - Full-Stack Developer plan on 10/11/2025, 17:18:19 (Europe/London)"\n
         when changing the brower's location to "London".
         Set the browser's location back to "Asia/Bangkok".`,()=>{    
        cy.setTimezone("Europe/London") 
        cy.signIn('67130500140', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text','Declared FS - Full-Stack Developer')
            .and('contain.text','on 10/11/2025, 17:18:19 (Europe/London)')

        cy.setTimezone("Asia/Bangkok") ;
    })
})