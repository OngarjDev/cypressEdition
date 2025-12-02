export function baseUrlIsPublic() {
    return Cypress.config().baseUrl.includes("bscit.sit.kmutt.ac.th/intproj25");
}


// Extract the displayed time from the text
export function getDisplayedTimeFromText(text) {
    const displayedTimeText = text.match(/(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})/);
    return displayedTimeText;
}


export function parseDisplayedTime(displayedTimeText) {  
    const raw = displayedTimeText[0];
    const [datePart, timePart] = raw.split(', ');
    const [day, month, year] = datePart.split('/');
    const [h, m, s] = timePart.split(':');
    const displayedTime = new Date(year, month - 1, day, h, m, s);
    return displayedTime;
}


export function shouldBeNow(text, {withinMs = 2000} = {}) {
    // Extract the displayed time from the text
    cy.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━') ;
    cy.log('┃ shouldBeNow: Verifying displayed time is close to current server time');
    cy.log(`┃ text: ${text}`);
    const displayedTimeText = getDisplayedTimeFromText(text);
    cy.log(`┃ extracted time: ${displayedTimeText}`);
    expect(displayedTimeText, "┃ There is a valid time in the text").to.not.be.null;
    
    const displayedTime = parseDisplayedTime(displayedTimeText);
    cy.log(`┃ parsed displayed time: ${displayedTime.toLocaleString('en-GB')}`);    
    
    // Fetch server time to reduce time drift issues
    cy.request('https://bscit.sit.kmutt.ac.th/intproj25/ft/itb-ecors/service-api/time')
      .then(res => {
        const serverNow = new Date(res.body.timestamp);
        cy.log(`┃ Server time: ${serverNow.toLocaleString('en-GB')}`);
        const timeDiff = Math.abs(serverNow.getTime() - displayedTime.getTime());
        cy.log(`┃ Time difference (ms): ${timeDiff}`);
        expect(timeDiff).to.be.lessThan(withinMs);
    });
    cy.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}