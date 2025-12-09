describe(`TC-PBI3-1 : VIEW-DECLARED PLAN\n
          normal : - has declaration\n
                   - use local timestamp`, () => {

    // Cypress.session.clearAllSavedSessions() ;


    it(`[step 1–2] - should visit /reserve.html successfully after signing in.
        should show the fullname "Somchai Jaidee" and should display 
        "'Declaration Status: Declared FS - Full-Stack Developer plan on 11/11/2025, 00:18:19 (Asia/Bangkok)".`, () => {
        cy.signIn('67130500140', 'itbangmod') ;
        cy.setTimezone("Asia/Bangkok") 
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
        cy.signIn('67130500140', 'itbangmod') ;
        cy.setTimezone("Europe/London") 
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text','Declared FS - Full-Stack Developer')
            .and('contain.text','on 10/11/2025, 17:18:19 (Europe/London)')

        cy.setTimezone("Asia/Bangkok") ;
    })
})