describe(`PBI11 : RESTRICT-RESERVATION-PERIOD`, () => {
    
    // Cypress.session.clearAllSavedSessions();

    before(function () {
        cy.log('* ');
        cy.log('*** Extracting a baseAPI from the request URL ***');
        cy.log('*** This will be used to send /__test__/time requests ***');
        cy.intercept('GET', '**/study-plans').as('getStudyPlans');
        cy.visit('');
        cy.wait('@getStudyPlans').then(({request}) => {
            Cypress.env('baseAPI', request.url.split('/study-plans')[0]);
            cy.log('Base API: ' + Cypress.env('baseAPI'));
        });
    });

    after(function () {
        cy.log('* ');
        cy.log('* Post-condition: Reset FE/BE clocks to real time');
        cy.log('Resetting server time');
        cy.resetServerTime();
        cy.clock().then((clock) => { clock.restore(); });
    });


    it(`Pre-condition: Must be itb-ecors public URL`, () => {
        cy.log('=====================================================');
        cy.log('>>> Pre-condition: Must be itb-ecors public URL');
        cy.log('=====================================================');
        cy.visit('');
        cy.url({timeout: 300}).then(url => {
            cy.log('Current URL: ' + url);
            expect(url).to.match(/bscit\.sit\.kmutt\.ac\.th\/intproj25.*\/itb-ecors\//);
        });
    });


    it(`TC-PBI11-1 : • five second before startDateTime of the first period – closed / next`, () => {
        cy.log('===================== TC-PBI11-1 =====================');
        cy.log('>>> Five second before startDateTime of the first period – closed / next');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-25T01:59:55Z'; // five second before startDateTime of the first period
        let studentId = '67130500140'; // Somchai Jaidee
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 25/11/2025 09:00 – 27/11/2025 18:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to five second before startDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 1.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 1.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer')
            .and('contain.text', 'on 11/11/2025, 00:18:19 (Asia/Bangkok)');
        cy.log('**** 1.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();

        studentId = '67130500149'; // Somjit Jaiyen
        cy.log('* ');
        cy.log(`* Step 3: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Not Declared');
        cy.log('**** 2.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-2 : • at startDateTime of the first period – open / next`, () => {
        cy.log('===================== TC-PBI11-2 =====================');
        cy.log('>>> at startDateTime of the first period – open / next');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-25T02:00:00Z'; // at startDateTime of the first period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is open",
            "current-period": "Period: 25/11/2025 09:00 – 27/11/2025 18:00 (Asia/Bangkok)",
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to startDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible').invoke('text').then(text => {
            cy.log('Declared plan text: ' + text);
            if (text.includes('Declared ')) {
                cy.log('A declared plan exists. Cancel it first.');
                cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
                cy.wait(Cypress.config('dialogWaitMs'));
                cy.get('.ecors-dialog .ecors-button-cancel').click();
                cy.wait(Cypress.config('regularWaitMs'));
                cy.closeDialogIfPresent();
            }
        });
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Declare FE');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-dropdown-plan').select('FE - Frontend Developer');
        cy.get('.ecors-button-declare').click();
        cy.wait('@declarePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
            expect(response.body.planId).to.equal(1);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Declared FE - Frontend Developer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'FE - Frontend Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 4: Change to BE');
        cy.intercept('PUT', '**/students/**').as('changePlan');
        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(200);
            expect(response.body.planId).to.equal(2);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration updated.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared BE - Backend Developer');
        cy.get('.ecors-declared-plan').invoke('text')
            .then(text => Cypress.utils.shouldBeNow(text, { withinMs: 3000 + 2 * Cypress.config('regularWaitMs') }));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'BE - Backend Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it(`TC-PBI11-3 : • five second before endDateTime of the first period – open / next`, () => {
        cy.log('===================== TC-PBI11-3 =====================');
        cy.log('>>> five second before endDateTime of the first period – open / next');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T10:59:55Z'; // five second before endDateTime of the first period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is open",
            "current-period": "Period: 25/11/2025 09:00 – 27/11/2025 18:00 (Asia/Bangkok)",
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to five second before endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared BE - Backend Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Cancel declaration -> Keep declaration');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-button-keep').should('contain.text', 'Keep Declaration').click();
        cy.shouldCloseDialog();
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared BE - Backend Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 4: Cancel declaration -> Cancel declaration');
        cy.intercept('DELETE', '**/students/**').as('cancelPlan');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@cancelPlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(200);
            expect(response.body.planId).to.equal(2);
            expect(response.body.status).to.equal('CANCELLED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration cancelled.");
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Cancelled BE - Backend Developer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it(`TC-PBI11-4 : • one second after endDateTime of the first period – closed / next`, () => {
        cy.log('===================== TC-PBI11-4 =====================');
        cy.log('>>> one second after endDateTime of the first period – closed / next');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T11:00:01Z'; // one second after endDateTime of the first period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second after endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Cancelled BE - Backend Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-5 : • In the middle of second period – open / none`, () => {
        cy.log('===================== TC-PBI11-5 =====================');
        cy.log('>>> In the middle of second period – open / none');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-28T13:00:00Z'; // in the middle of second period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is open",
            "current-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)",
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to the middle of second period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Cancelled BE - Backend Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Declare FS');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-dropdown-plan').select('FS - Full-Stack Developer');
        cy.get('.ecors-button-declare').click();
        cy.wait('@declarePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
            expect(response.body.planId).to.equal(3);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Declared FS - Full-Stack Developer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'FS - Full-Stack Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it(`TC-PBI11-6 : • one second after endDateTime of the second period – closed / none`, () => {
        cy.log('===================== TC-PBI11-6 =====================');
        cy.log('>>> one second after endDateTime of the second period – closed / none');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second after endDateTime of the second period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-7 : • after endDate of 2025S1 but before startDate of 2025S2 – closed / next`, () => {
        cy.log('===================== TC-PBI11-7 =====================');
        cy.log('>>> after endDate of 2025S1 but before startDate of 2025S2 – closed / next');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-12-14T00:00:00Z'; // after endDate of 2025S1 but before startDate of 2025S2
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to after endDate of 2025S1 but before startDate of 2025S2');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-8 : • at startDateTime of 2025S2 – closed / next`, () => {
        cy.log('===================== TC-PBI11-8 =====================');
        cy.log('>>> at startDateTime of 2025S2 – closed / next');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2026-01-12T00:00:00Z'; // at startDateTime of 2025S2
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 04/03/2026 09:00 – 06/03/2026 18:30 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to startDateTime of 2025S2');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-9 : error
                • Perform action after the reservation period is closed
                • Declare – failed`, () => {
        cy.log('===================== TC-PBI11-9 =====================');
        cy.log('>>> Perform action after the reservation period is closed');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T10:59:55Z'; // five second before endDateTime of the first period
        let studentId = '67130500149'; // Somjit Jaiyen
        let expectedReservationPeriodsBefore = {
            "current-message": "Reservation is open",
            "current-period": "Period: 25/11/2025 09:00 – 27/11/2025 18:00 (Asia/Bangkok)",
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };
        let expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to five second before endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsBefore);

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to one second after endDateTime of the first period');
        testTime = '2025-11-27T11:00:01Z'; // one second after endDateTime of the first period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Declare AI');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-dropdown-plan').select('AI - AI Developer');
        cy.get('.ecors-button-declare').click();
        cy.get('@declarePlan.all')
            .should('have.length', 0, 'Declaration should be blocked on the FE side');
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 4.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
        .and('contain.text', 'Not Declared');
        cy.log('**** 4.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-10 : error
                • Perform action after the reservation period is closed
                • Change – failed`, () => {
        cy.log('===================== TC-PBI11-10 =====================');
        cy.log('>>> Perform action after the reservation period is closed');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T10:59:55Z'; // five second before endDateTime of the first period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriodsBefore = {
            "current-message": "Reservation is open",
            "current-period": "Period: 25/11/2025 09:00 – 27/11/2025 18:00 (Asia/Bangkok)",
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };
        let expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to five second before endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsBefore);

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to one second after endDateTime of the first period');
        testTime = '2025-11-27T11:00:01Z'; // one second after endDateTime of the first period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Change to AI');
        cy.intercept('PUT', '**/students/**').as('changePlan');
        cy.get('.ecors-dropdown-plan').select('AI - AI Developer');
        cy.get('.ecors-button-change').click();
        cy.get('@changePlan.all')
            .should('have.length', 0, 'Change declaration should be blocked on the FE side');
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 4.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
        .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 4.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-11 : error
                • Perform action after the reservation period is closed
                • Cancel – failed`, () => {
        cy.log('===================== TC-PBI11-11 =====================');
        cy.log('>>> Perform action after the reservation period is closed');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T10:59:55Z'; // five second before endDateTime of the first period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriodsBefore = {
            "current-message": "Reservation is open",
            "current-period": "Period: 25/11/2025 09:00 – 27/11/2025 18:00 (Asia/Bangkok)",
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };
        let expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to five second before endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsBefore);

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to one second after endDateTime of the first period');
        testTime = '2025-11-27T11:00:01Z'; // one second after endDateTime of the first period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Cancel declaration');
        cy.intercept('DELETE', '**/students/**').as('deletePlan');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.get('@deletePlan.all')
            .should('have.length', 0, 'Cancel declaration should be blocked on the FE side');
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 4.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
        .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 4.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-12 : • Client time is slower than server by 5 seconds
                      • Declare – success
                      • Change – success
                      • Cancel – success`, () => {
        cy.log('===================== TC-PBI11-12 =====================');
        cy.log('>>> Client time is slower than server by 5 seconds');
        cy.log('=====================================================');
        // Declare test variables
        let serverTime = '2025-11-28T02:00:00Z'; // at startDateTime of the second period
        let clientTime = '2025-11-28T01:59:55Z'; // 5 seconds before startDateTime of the second period
        let studentId = '67130500146'; // Somkiet Deejai
        let expectedReservationPeriods = {
            "current-message": "Reservation is open",
            "current-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)",
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set BE clocks to startDateTime of the second period. Set FE clocks to 5 seconds before startDateTime of the second period');
        cy.setServerTime(serverTime);
        cy.clock(new Date(clientTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible').invoke('text').then(text => {
            cy.log('Declared plan text: ' + text);
            if (text.includes('Declared ')) {
                cy.log('A declared plan exists. Cancel it first.');
                cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
                cy.wait(Cypress.config('dialogWaitMs'));
                cy.get('.ecors-dialog .ecors-button-cancel').click();
                cy.wait(Cypress.config('regularWaitMs'));
                cy.closeDialogIfPresent();
            }
        });
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Declare AI');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-dropdown-plan').select('AI - AI Developer');
        cy.get('.ecors-button-declare').click();
        cy.wait('@declarePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
            expect(response.body.planId).to.equal(4);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Declared AI - AI Developer');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'AI - AI Developer');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 4: Change to DS');
        cy.intercept('PUT', '**/students/**').as('changePlan');
        cy.get('.ecors-dropdown-plan').select('DS - Data Scientist');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(200);
            expect(response.body.planId).to.equal(5);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration updated.");
        cy.get('.ecors-button-dialog').click();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared DS - Data Scientist');
        cy.get('.ecors-declared-plan').invoke('text')
            .then(text => Cypress.utils.shouldBeNow(text, { withinMs: 3000 + 2 * Cypress.config('regularWaitMs') }));
        cy.get('.ecors-dropdown-plan option:selected').should('have.text',  'DS - Data Scientist');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 5: Cancel declaration -> Cancel declaration');
        cy.intercept('DELETE', '**/students/**').as('cancelPlan');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@cancelPlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(200);
            expect(response.body.planId).to.equal(5);
            expect(response.body.status).to.equal('CANCELLED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Declaration cancelled.");
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.includes('Cancelled DS - Data Scientist');
            Cypress.utils.shouldBeNow(text, { withinMs: 3000 + Cypress.config('regularWaitMs') });
        });
        cy.get('.ecors-dropdown-plan').should('have.value', '');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');
    });


    it(`TC-PBI11-13 : error
                       • Client time is slower than server by 5 seconds
                       • Declare – failed`, () => {
        cy.log('===================== TC-PBI11-13 =====================');
        cy.log('>>> Client time is slower than server by 5 seconds');
        cy.log('=====================================================');
        // Declare test variables
        let serverTime = '2025-12-01T09:59:56Z'; // at 4 second before endDateTime of the second period
        let clientTime = '2025-12-01T09:59:51Z'; // at 9 seconds before endDateTime of the second period
        let studentId = '67130500146'; // Somkiet Deejai
        let expectedReservationPeriodsBefore = {
            "current-message": "Reservation is open",
            "current-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)",
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };
        let expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set BE clocks to 4 seconds before endDateTime of the second period. Set FE clocks to 9 seconds before endDateTime of the second period');
        cy.setServerTime(serverTime);
        cy.clock(new Date(clientTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsBefore);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible').invoke('text').then(text => {
            cy.log('Declared plan text: ' + text);
            if (text.includes('Declared ')) {
                cy.log('A declared plan exists. Cancel it first.');
                cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
                cy.wait(Cypress.config('dialogWaitMs'));
                cy.get('.ecors-dialog .ecors-button-cancel').click();
                cy.wait(Cypress.config('regularWaitMs'));
                cy.closeDialogIfPresent();
            }
        });
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-declare');
        cy.shouldBeHiddenOrNotExist('.ecors-button-change');
        cy.shouldBeHiddenOrNotExist('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks 5 seconds');
        serverTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        clientTime = '2025-12-01T09:59:56Z'; // five seconds before endDateTime of the second period
        cy.setServerTime(serverTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(clientTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Declare DA');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-dropdown-plan').select('DA - Data Analyst');
        cy.get('.ecors-button-declare').click();
        cy.wait('@declarePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(403);
            cy.fixture('declared-plan/403-reservation-period-closed.json').then(expected => {
            expect(response.body).to.includes(expected)});
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");

        cy.log('* ');
        cy.log('* Step 5: Close the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 5.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('not.contain.text', 'Declared ');
        cy.log('**** 5.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-14 : error
                            • Client time is slower than server by 5 seconds
                            • Change – failed`, () => {
        cy.log('===================== TC-PBI11-14 =====================');
        cy.log('>>> Client time is slower than server by 5 seconds');
        cy.log('=====================================================');
        // Declare test variables
        let serverTime = '2025-12-01T09:59:56Z'; // at 4 second before endDateTime of the second period
        let clientTime = '2025-12-01T09:59:51Z'; // at 9 seconds before endDateTime of the second period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriodsBefore = {
            "current-message": "Reservation is open",
            "current-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)",
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };
        let expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set BE clocks to 4 seconds before endDateTime of the second period. Set FE clocks to 9 seconds before endDateTime of the second period');
        cy.setServerTime(serverTime);
        cy.clock(new Date(clientTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsBefore);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
          .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks 5 seconds');
        serverTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        clientTime = '2025-12-01T09:59:56Z'; // five seconds before endDateTime of the second period
        cy.setServerTime(serverTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(clientTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Change to DA');
        cy.intercept('PUT', '**/students/**').as('changePlan');
        cy.get('.ecors-dropdown-plan').select('DA - Data Analyst');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(403);
            cy.fixture('declared-plan/403-reservation-period-closed.json').then(expected => {
            expect(response.body).to.includes(expected)});
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");

        cy.log('* ');
        cy.log('* Step 5: Close the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 5.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 5.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });




    it(`TC-PBI11-15 : error
                            • Client time is slower than server by 5 seconds
                            • Cancel – failed`, () => {
        cy.log('===================== TC-PBI11-15 =====================');
        cy.log('>>> Client time is slower than server by 5 seconds');
        cy.log('=====================================================');
        // Declare test variables
        let serverTime = '2025-12-01T09:59:56Z'; // at 4 second before endDateTime of the second period
        let clientTime = '2025-12-01T09:59:51Z'; // at 9 seconds before endDateTime of the second period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriodsBefore = {
            "current-message": "Reservation is open",
            "current-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)",
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };
        let expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };

        cy.log('* ');
        cy.log('* Step 1: Set BE clocks to 4 seconds before endDateTime of the second period. Set FE clocks to 9 seconds before endDateTime of the second period');
        cy.setServerTime(serverTime);
        cy.clock(new Date(clientTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsBefore);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
          .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.shouldBeHiddenOrNotExist('.ecors-button-declare');
        cy.shouldBeVisibleAndNotClickable('.ecors-button-change');
        cy.shouldBeVisibleAndClickable('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)');

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks 5 seconds');
        serverTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        clientTime = '2025-12-01T09:59:56Z'; // five seconds before endDateTime of the second period
        cy.setServerTime(serverTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(clientTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Cancel declaration');
        cy.intercept('DELETE', '**/students/**').as('deletePlan');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog .ecors-button-cancel').click();
        cy.wait('@deletePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(403);
            cy.fixture('declared-plan/403-reservation-period-closed.json').then(expected => {
            expect(response.body).to.includes(expected)});
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");

        cy.log('* ');
        cy.log('* Step 5: Close the dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 5.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 5.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });


    it(`TC-PBI11-16 : error
                        • Client time is faster than server by 5 seconds (unlikely)`, () => {
        cy.log('===================== TC-PBI11-16 =====================');
        cy.log('>>> Client time is faster than server by 5 seconds (unlikely)');
        cy.log('=====================================================');
        // Declare test variables
        let serverTime = '2025-11-28T01:59:55Z'; // at 5 second before startDateTime of the second period
        let clientTime = '2025-11-28T02:00:00Z'; // at startDateTime of the second period
        let studentId = '67130500145'; // Somsak Sukjung
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set BE clocks to 5 seconds before startDateTime of the second period. Set FE clocks to startDateTime of the second period');
        cy.setServerTime(serverTime);
        cy.clock(new Date(clientTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer');
        cy.log('**** 2.3 Verify buttons status');
        cy.declarationSectionShouldBeHidden();
    });

});