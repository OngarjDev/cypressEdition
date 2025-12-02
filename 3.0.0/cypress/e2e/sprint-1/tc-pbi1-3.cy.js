describe(`TC-PBI1-3 : VIEW-PLAN-LIST\n
          failed : - the system fails to fetch study plans`, () => {

    let resource = '/'  
    let baseAPI = Cypress.config('baseAPI')

    beforeEach(()=> {
        cy.visit(resource) ;
        cy.wait(100) ;
    }) ;

    it(`[step 3] The page should show empty table with headers: ID,Study Code, English Name, Thai Name.\n
        The dialog should be shown with the message "There is a problem. Please try again later."`,()=>{
        cy.intercept('GET',`${baseAPI}/**`,{
            statusCode: 502,
            body: {data: []}
        }).as('request')

        cy.visit(resource)

        cy.wait('@request').then((interception)=>{
            const response = interception.response
            expect(response.statusCode).to.equal(502)
        })

        cy.get('dialog').should('be.visible') ;
        cy.get('dialog .ecors-dialog-message').should('have.text','There is a problem. Please try again later.') ;
    })


    it(`[step 4] Dialog should have attribute closedby="none"`,()=>{
        cy.intercept('GET',`${baseAPI}/**`,{
            statusCode: 502,
            body: {data: []}
        }).as('request')

        cy.visit(resource)

        cy.wait('@request').then((interception)=>{
            const response = interception.response
            expect(response.statusCode).to.equal(502)
        })

        cy.get('.ecors-dialog').should('be.visible') ;
        cy.get('.ecors-dialog .ecors-dialog-message').should('have.text','There is a problem. Please try again later.') ;

        cy.get('dialog.ecors-dialog').should('have.attr','closedby','none') ;
        cy.get('dialog.ecors-dialog').find('button').should('not.exist') ;
    })

    it(`Repeat step 2 with mock response = 401 Unauthorized.`,()=>{
        cy.intercept('GET',`${baseAPI}/**`,{
            statusCode: 401 ,
            body: {data: []}
        }).as('request')

        cy.visit(resource)

        cy.wait('@request').then((interception)=>{
            const response = interception.response
            expect(response.statusCode).to.equal(401)
        })

        cy.get('.ecors-dialog').should('be.visible') ;
        cy.get('.ecors-dialog .ecors-dialog-message').should('have.text','There is a problem. Please try again later.') ;

        cy.get('dialog.ecors-dialog').should('have.attr','closedby','none') ;
        cy.get('dialog.ecors-dialog').find('button').should('not.exist') ;
    })
})