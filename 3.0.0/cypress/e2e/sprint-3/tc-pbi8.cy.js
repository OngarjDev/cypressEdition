describe(`"TC-PBI8-1 : SECURE-CONNECTION'`, () => {
    
    Cypress.session.clearAllSavedSessions() ;


    it(`TC-PBI8-1 : SECURE-CONNECTION - Test CRUD operations over secure connection (HTTPS)`, () => {
    cy.log('===================== TC-PBI8-1 =====================') ;
    cy.log('>>> Test CRUD operations over secure connection (HTTPS)') ;
    cy.log('=====================================================') ;

    cy.log('* ') ;
    cy.log('* Step 0: Must be itb-ecors public URL') ;
        cy.visit('') ;
        cy.url().then(url => cy.log('Current URL: ' + url)) ;
        cy.url().should('match', /bscit\.sit\.kmutt\.ac\.th\/intproj25.*\/itb-ecors\//) ;

    cy.log('* ') ;
    cy.log('* Step 1: Make sure the connection is secure (HTTPS)') ;
        cy.location('protocol').should('eq', 'https:') ;
        cy.signIn('67130500144', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.location('protocol').should('eq', 'https:') ;

    cy.log('* ') ;
    cy.log('* Step 2: Perform GET declared plan over HTTPS') ;
        cy.intercept('GET', '**/students/67130500144/declared-plan').as('getDeclaredPlanHTTPS') ;
        cy.reload() ;
        cy.wait('@getDeclaredPlanHTTPS').then(({ request, response }) => {
            expect(request.url).to.include('https://') ;
            if (response.statusCode === 404 || response.body.status === 'CANCELLED') {
                cy.get('.ecors-declared-plan').should('exist').and('be.visible') ;
                cy.get('.ecors-declared-plan').invoke('text').then( text => {
                    expect(text).to.satisfy(t => t.includes('Declaration Status: Not Declared')
                     || t.includes('Cancelled')) ;
                }) ;
                cy.get('.ecors-dropdown-plan').should('have.value','') ;
                cy.shouldBeVisibleAndNotClickable('.ecors-button-declare') ;
                cy.get('.ecors-dropdown-plan').select('UX - UX/UI Designer') ;
                cy.get('.ecors-dropdown-plan').should('contain.text','UX - UX/UI Designer'); 
                cy.shouldBeVisibleAndClickable('.ecors-button-declare') ;
                cy.get('.ecors-button-declare').click() ;
                cy.wait(Cypress.config('regularWaitMs')) ;
                cy.get('.ecors-declared-plan').should('exist').and('be.visible')
                  .and('contain.text','Declared UX - UX/UI Designer') ;
                cy.get('.ecors-declared-plan').invoke('text').as('statusAfterDeclare')
                  .then( text => Cypress.utils.shouldBeNow(text)) ;
            }
            cy.shouldBeHiddenOrNotExist('.ecors-button-declare') ;
            cy.shouldBeVisibleAndNotClickable('.ecors-button-change') ;
            cy.shouldBeVisibleAndClickable('.ecors-button-cancel') ;
        }) ;

    cy.log('* ') ;
    cy.log('* Step 3: Perform PUT a declared plan over HTTPS') ;
        cy.get('.ecors-dropdown-plan').select('DB - Database Administrator') ;
        cy.shouldBeVisibleAndClickable('.ecors-button-change') ;
        cy.get('.ecors-button-change').click() ;
        cy.wait(Cypress.config('regularWaitMs')) ;
        cy.shouldShowDialog("Declaration updated.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs')) ;
        cy.get('.ecors-declared-plan').should('contain.text','Declared DB - Database Administrator');
        cy.get('.ecors-declared-plan').invoke('text').as('statusAfterChange1').then( text => Cypress.utils.shouldBeNow(text, {withinMs: 3000})) ;
        cy.get('.ecors-dropdown-plan').should('contain.text','DB - Database Administrator') ;   
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare') ;
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change') ;

    cy.log('* ') ;
    cy.log('* Step 4: Perform DELETE a declared plan over HTTPS') ;
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click() ;
        cy.get('.ecors-dialog .ecors-button-cancel').should('contain.text','Cancel Declaration').click() ;
        cy.wait(Cypress.config('regularWaitMs')) ;
        cy.shouldShowDialog("Declaration cancelled.") ;
        cy.get('.ecors-button-dialog').click() ;
        cy.wait(Cypress.config('regularWaitMs')) ;
        cy.get('.ecors-declared-plan').invoke('text').then( text => {
            expect(text).to.includes('Cancelled DB - Database Administrator') ;
            Cypress.utils.shouldBeNow(text, {withinMs: 2000}) ;
        });
        cy.get('.ecors-dropdown-plan').should('have.value','') ;
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare') ;
        cy.shouldBeHiddenOrNotExist('.ecors-button-change') ;
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)') ;
    })
})