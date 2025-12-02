describe(`TC-PBI2-1 : SIGN-IN-AND-OUT-WITH-EXTERNAL-SERVICE
          normal : - successful sign-in
                   - SSO
                   - successful sign-out`, () => {

    Cypress.session.clearAllSavedSessions() ;


    it("[step 1] The page should have the button 'Manage study plan declaration and course reservation'.", () => {
        cy.visit('/');
        cy.get('.ecors-button-manage')
            .should('exist')
            .and('be.visible')
            .and('contain.text','Manage study plan declaration and course reservation');
        
        cy.get('.ecors-button-manage').then($btn => {
            const el = $btn[0];
            const expected = 'reserve';

            if (el.tagName.toLowerCase() === 'a') {
                cy.log('Detected <a> link button');
                cy.wrap($btn).should('have.attr', 'href').and('include', expected);
                return;
            }

            const onclick = el.getAttribute('onclick');
            if (onclick) {
                cy.log('Detected onclick redirect button');
                expect(onclick).to.include(expected);
                return;
            }

            cy.log('Detected router-based navigation');
            cy.wrap($btn).click();
            cy.url().should('include', expected);
        });
    })


    it('[step 2] should click the button "Manage ...". FE should redirect to ./reserve.html, which then redirect automatically to ITB-ECoRS Authentication System.',()=>{
        cy.visit('/');
        cy.get('.ecors-button-manage').click() ;
        cy.wait(Cypress.config().keycloakWaitMs) ;
        
        cy.url().should('include', Cypress.config().keycloakUrl + '/protocol/openid-connect/auth') ;
    })


    it(`[step 3] should fill in valid credentials and be able to sign in successfully.\n
        should show the fullname and the button 'Sign Out'.`, ()=>{
            
        cy.signIn('67130500141', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config().regularWaitMs) ;

        // After successful login, it should redirect back to the reserve page
        cy.url().should('include','/reserve.html') ;

        cy.get('.ecors-fullname').should('exist').and('be.visible').and('contain.text','Somsuan Sukjai') ;
        cy.get('.ecors-button-signout').should('exist').and('be.visible').and('contain.text','Sign Out') ;
    })


    it(`[step 4] should visit the page reserve.html without signing in again.`,()=>{    
        cy.signIn('67130500141', 'itbangmod') ;
        cy.visit('/') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config().keycloakWaitMs) ;

        cy.get('.ecors-fullname').should('exist').and('be.visible').and('contain.text','Somsuan Sukjai') ;
        cy.get('.ecors-button-signout').should('exist').and('be.visible').and('contain.text','Sign Out') ;
    })

    it(`[step 5 and 6] should sign out successfully when clicking the 'Sign Out' button.
        FE should redirect to home page with study plan table.
        Should force the user to authenticate again when accessing reserve.html after sign out`,()=>{    
        cy.signIn('67130500141', 'itbangmod') ;
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config().keycloakWaitMs) ;

        // Click the 'Sign Out' button
        cy.get('.ecors-button-signout').should('exist').and('be.visible').and('contain.text','Sign Out').click() ;
        cy.wait(Cypress.config().keycloakWaitMs) ;

        // After sign out, it should redirect to home page
        cy.url().should('match', /\/itb-ecors(\/|\/index\.html)?$/);

        // The home page should have the study plan table
        cy.contains('th','ID')
        cy.contains('th','Study Code')
        cy.contains('th','English Name')
        cy.contains('th','Thai Name')
        cy.get('.ecors-row').should('have.length',9)

        // It should redirect to SSO login page   
        cy.visit('/reserve.html') ;
        cy.wait(Cypress.config().keycloakWaitMs) ;
        cy.url().should('include', Cypress.config().keycloakUrl + '/protocol/openid-connect/auth') ;
    })
})