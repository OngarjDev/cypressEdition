describe(`TC-PBI1-1 : VIEW-PLAN-LIST\n
          normal : - the system operates normally\n
                   - study_plans table is empty`, () => {

    let resource = '/'  
    let baseAPI = Cypress.config('baseAPI')

    beforeEach(()=> {
        cy.visit(resource) ;
        cy.wait(100) ;
    }) ;

    it("The page should request the backend server that include 'bscit.sit.kmutt.ac.th' and end with '/v1/study-plans'", () => {
        cy.intercept('GET',`${baseAPI}/**`).as('request')

        cy.visit(resource)  
        cy.wait('@request').then((interception)=>{
            const request = interception.request
            expect(request.url).to.include('bscit.sit.kmutt.ac.th')
            expect(request.url).to.match(/\/v1\/study-plans$/)
        })
        
    })

    it('The page should show empty table with headers: ID,Study Code, English Name, Thai Name.',()=>{
        cy.intercept('GET',`${baseAPI}/**`,{
            statusCode: 200,
            body: {data: []}
        }).as('request')

        cy.visit(resource)

        cy.wait('@request').then((interception)=>{
            const response = interception.response
            expect(response.statusCode).to.equal(200)
        })

        cy.contains('th','ID')
        cy.contains('th','Study Code')
        cy.contains('th','English Name')
        cy.contains('th','Thai Name')

        cy.get('.ecors-row').should('have.length',0)
    })
})