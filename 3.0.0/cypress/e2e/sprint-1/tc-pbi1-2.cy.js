describe(`TC-PBI1-2 : VIEW-PLAN-LIST\n
          normal : - study_plans table has 9 records`, () => {
    let resource = '/'  
    let baseAPI = Cypress.config('baseAPI')

    beforeEach(()=> {
        cy.visit(resource) ;
        cy.wait(100) ;
    }) ;

    it(`The page should show study plans table with headers (ID, Study Code, English Name, Thai Name) and 9 entries.`,()=>{

        cy.contains('th','ID')
        cy.contains('th','Study Code')
        cy.contains('th','English Name')
        cy.contains('th','Thai Name')

        cy.get('.ecors-row').should('have.length',9)
    })


    it(`The page should show study plans in the following order: FE, BE, FS, AI, DS, DA, DE, DB, UX.`,()=>{
        cy.get('.ecors-row').eq(0).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','1')
        cy.get('@row').find('.ecors-planCode').should('have.text','FE')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Frontend Developer')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักพัฒนาฟรอนเอนด์')

        cy.get('.ecors-row').eq(1).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','2')
        cy.get('@row').find('.ecors-planCode').should('have.text','BE')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Backend Developer')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักพัฒนาแบ็กเอนด์')

        cy.get('.ecors-row').eq(2).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','3')
        cy.get('@row').find('.ecors-planCode').should('have.text','FS')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Full-Stack Developer')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักพัฒนาฟูลสแตก')

        cy.get('.ecors-row').eq(3).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','4')
        cy.get('@row').find('.ecors-planCode').should('have.text','AI')
        cy.get('@row').find('.ecors-nameEng').should('have.text','AI Developer')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักพัฒนาปัญญาประดิษฐ์')

        cy.get('.ecors-row').eq(4).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','5')
        cy.get('@row').find('.ecors-planCode').should('have.text','DS')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Data Scientist')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักวิทยาการข้อมูล')

        cy.get('.ecors-row').eq(5).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','6')
        cy.get('@row').find('.ecors-planCode').should('have.text','DA')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Data Analyst')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักวิเคราะห์ข้อมูล')

        cy.get('.ecors-row').eq(6).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','7')
        cy.get('@row').find('.ecors-planCode').should('have.text','DE')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Data Engineer')
        cy.get('@row').find('.ecors-nameTh').should('have.text','วิศวกรข้อมูล')
        
        cy.get('.ecors-row').eq(7).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','8')
        cy.get('@row').find('.ecors-planCode').should('have.text','DB')
        cy.get('@row').find('.ecors-nameEng').should('have.text','Database Administrator')
        cy.get('@row').find('.ecors-nameTh').should('have.text','ผู้ดูแลฐานข้อมูล')  

        cy.get('.ecors-row').eq(8).as('row')
        cy.get('@row').find('.ecors-id').should('have.text','9')
        cy.get('@row').find('.ecors-planCode').should('have.text','UX')
        cy.get('@row').find('.ecors-nameEng').should('have.text','UX/UI Designer')
        cy.get('@row').find('.ecors-nameTh').should('have.text','นักออกแบบประสบการณ์ของผู้ใช้และส่วนต่อประสาน')
    })
})