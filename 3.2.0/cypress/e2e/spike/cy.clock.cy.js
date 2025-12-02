describe('cy.clock', () => {
  
  it('should set the clock to a specific time', () => {
    cy.clock(new Date('2025-12-01T09:00:00+07:00').getTime(), ['Date']);
    cy.visit('http://localhost:5173/datetime.html');
    cy.getBySel('date-section').invoke('text').then((text) => { cy.log(text); });
    cy.clock().then((clock) => {clock.setSystemTime(new Date('2025-12-02T09:00:00+07:00').getTime()); });
    cy.getBySel('update-button').click();
    cy.getBySel('date-section').invoke('text').then((text) => { cy.log(text); });
  });

  // it('should tick the clock forward', () => {
  //   cy.clock();
  //   cy.visit('http://localhost:5173/datetime.html');
  //   cy.get('#time').should('have.text', '2023-10-01T00:00:00.000Z');
  //   cy.tick(1000);
  //   cy.get('#time').should('have.text', '2023-10-01T00:00:01.000Z');
  // }
  // );

  // it('should restore the clock to the real time', () => {
  //   cy.clock(new Date(2020, 0, 1).getTime());
  //   cy.get('#time').should('have.text', '2020-01-01T00:00:00.000Z');
  //   cy.restore();
  //   cy.get('#time').should('not.have.text', '2020-01-01T00:00:00.000Z');
  // });
});
