import { shouldBeNow } from "../../support/utils";

describe('Spike the use of shouldBeNow utility function and time from server', () => {
    // it('should verify that the local time is close to server time', () => {
    //     const now = new Date();

    //     expect(shouldBeNow(now.toLocaleString('en-GB'))).to.not.throw; ;
    // }) ;

    it('test http', () => {
    cy.log('* ') ;
    cy.log('* Step 1: Make sure the connection is secure (HTTPS)') ;
        // cy.location('protocol').should('eq', 'https:') ;
        // cy.signIn('67130500144', 'itbangmod') ;
        // cy.visit('/reserve.html') ;
        cy.location('protocol').then( protocol => {
            cy.log('Current protocol: ' + protocol) ;
        });
        cy.url().then( url => {
            cy.log('Current URL: ' + url) ;
            cy.log(cy.url.protocol) ;
        });
    });    
}) ;