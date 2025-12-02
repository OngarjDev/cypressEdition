describe(`TC-PBI4-1 : DECLARE-PLAN\n
          normal : - test 'Declare' button enable/disable logic`, () => {

    Cypress.session.clearAllSavedSessions() ;

    
    it(`[step 1] should have a dropdown to select a study plan and should show drop-down list with 9 study plans.\n
        should not select any plan by default.\n
        should disable the 'Declare' button by default.`,()=>{    
        cy.signIn('67130500142', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-dropdown-plan').should('exist').and('be.visible') ;
        cy.get('.ecors-dropdown-plan').trigger('mousedown')
        cy.get('.ecors-plan-row').should('have.length',9) ;

        cy.get('.ecors-plan-row').eq(0).should('contain.text','FE - Frontend Developer')
        cy.get('.ecors-plan-row').eq(1).should('contain.text','BE - Backend Developer') ;
        cy.get('.ecors-plan-row').eq(2).should('contain.text','FS - Full-Stack Developer') ;
        cy.get('.ecors-plan-row').eq(3).should('contain.text','AI - AI Developer') ;
        cy.get('.ecors-plan-row').eq(4).should('contain.text','DS - Data Scientist') ;
        cy.get('.ecors-plan-row').eq(5).should('contain.text','DA - Data Analyst') ;
        cy.get('.ecors-plan-row').eq(6).should('contain.text','DE - Data Engineer') ;
        cy.get('.ecors-plan-row').eq(7).should('contain.text','DB - Database Administrator') ;
        cy.get('.ecors-plan-row').eq(8).should('contain.text','UX - UX/UI Designer') ;

        // By default, no plan is selected
        cy.get('.ecors-dropdown-plan').should('have.value','') ;
        cy.get('.ecors-button-declare').should('exist').and('be.visible').and('be.disabled') ;
    })

    it(`[step 2 and 3] should select a 'UX - UX/UI Designer' from the dropdown and enable the 'Declare' button.
        When un-select, should disable the 'Declare' button.`,()=>{    
        cy.signIn('67130500142', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config('regularWaitMs')) ;

        cy.get('.ecors-dropdown-plan').select('UX - UX/UI Designer') ;
        cy.get('.ecors-dropdown-plan').should('contain.text','UX - UX/UI Designer'); 
        cy.get('.ecors-button-declare').should('exist').and('be.visible').and('be.enabled') ;

        cy.get('.ecors-dropdown-plan').select('') ;
        cy.get('.ecors-dropdown-plan').should('have.value','') ;
        cy.get('.ecors-button-declare').should('exist').and('be.visible').and('be.disabled') ;
    })
})