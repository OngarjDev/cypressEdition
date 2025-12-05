describe('PBI9 : RESERVE-COURSES', () => {

    const courseOfferingsS3 = [
        'INT220 UX Design 3 credits',
        'INT241 Data Structures and Algorithms 3 credits',
        'INT242 Java Programming 3 credits',
        'INT243 Python Programming 3 credits',
        'INT250 CSS Framework 3 credits',
        'INT270 Mathematics for Artificial Intelligence 3 credits',
        'INT282 Statistics for Data Science 1 credits',
        'INT290 Advanced SQL 1 credits',
        'INT291 Physical Database Concepts and Design 1 credits',
        'INT292 Query Processing Concepts 1 credits'
    ];

    const courseOfferingsS4 = [
        'INT221 UI Design 3 credits',
        'INT251 Frontend Development Framework 3 credits',
        'INT261 Backend Development Framework 3 credits',
        'INT271 Machine Learning 3 credits',
        'INT272 Artificial Neural Networks and Deep Learning 2 credits',
        'INT273 Generative Deep Learning 1 credits',
        'INT293 Transaction Processing 1 credits',
        'INT294 Data Warehouse and OLAP 2 credits',
        'INT295 Database Authentication and Authorization 1 credits'
    ]

    const courseOfferingsS3Codes = courseOfferingsS3.map(co => co.split(' ')[0]);
    const courseOfferingsS3Titles = courseOfferingsS3.map(co => {
        const parts = co.split(' ');
        return parts.slice(1, parts.length - 2).join(' ');
    });
    const courseOfferingsS3Credits = courseOfferingsS3.map(co => {
        const parts = co.split(' ');
        return parts[parts.length - 2];
    });
    const courseOfferingsS4Codes = courseOfferingsS4.map(co => co.split(' ')[0]);
    const courseOfferingsS4Titles = courseOfferingsS4.map(co => {
        const parts = co.split(' ');
        return parts.slice(1, parts.length - 2).join(' ');
    });
    const courseOfferingsS4Credits = courseOfferingsS4.map(co => {
        const parts = co.split(' ');
        return parts[parts.length - 2];
    });

    Cypress.session.clearAllSavedSessions();

    before(function () {
        cy.log('* ');
        cy.log('*** Extracting a baseAPI from the request URL ***');
        cy.log('*** This will be used to send /__test__/time requests ***');
        cy.intercept({method: 'GET', url: '**/study-plans', times: 1}).as('getStudyPlans');
        cy.visit('');
        cy.wait('@getStudyPlans').then(({ request }) => {
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
        cy.url({ timeout: 300 }).then(url => {
            cy.log('Current URL: ' + url);
            expect(url).to.match(/bscit\.sit\.kmutt\.ac\.th\/intproj25.*\/itb-ecors\//);
        });
    });


    it(`TC-PBI9-1 : • no reservations / has declared plan`, () => {
        cy.log('===================== TC-PBI9-1 =====================');
        cy.log('>>> No reservations / has declared plan');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T10:59:59Z'; // one second before endDateTime of the first period
        let studentId = '67130500141'; // Somsuan Sukjai 
        const coreCourses = [
            'INT241 Data Structures and Algorithms',
            'INT243 Python Programming',
            'INT270 Mathematics for Artificial Intelligence',
            'INT271 Machine Learning',
            'INT272 Artificial Neural Networks and Deep Learning',
            'INT273 Generative Deep Learning',
            'INT370 Applied Natural Language Processing'
        ];
        const coreCourseOfferingCodes = [
            'INT241',
            'INT243',
            'INT270',
        ];

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second before endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 1.1 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared AI - AI Developer')
            .and('contain.text', 'on 10/11/2025, 22:59:59 (Asia/Bangkok)');
        cy.log('**** 1.2 Verify core courses for AI Developer');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for AI Developer');
        cy.getBySel('core-course').should('have.length', coreCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCourses[index]);
        });
        cy.log('**** 1.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 0 / 9');
        cy.log('**** 1.4 Verify course offerings display');
        cy.getBySelMultiple('course-offering').should('have.length', 10)
        cy.getBySel('course-code').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Codes[index]);
        });
        cy.getBySel('course-title').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Titles[index]);
        });
        cy.getBySel('course-credits').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Credits[index] + ' credit');
        });
        cy.log('**** 1.5 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', coreCourseOfferingCodes.length).each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            expect(coreCourseOfferingCodes).to.include(courseCode);
        });
        cy.log('**** 1.6 Verify Reserve buttons');
        cy.getBySel('button-reserve').should('have.length', 10).each(($el) => {
            cy.wrap($el).should('be.enabled').and('contain.text', 'Reserve');
        });

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to one second after endDateTime of the first period');
        testTime = '2025-11-27T11:00:01Z'; // one second after endDateTime of the first period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Reload reserve.html page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared AI - AI Developer')
            .and('contain.text', 'on 10/11/2025, 22:59:59 (Asia/Bangkok)');
        cy.log('**** 2.2 Verify core courses for AI Developer');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for AI Developer');
        cy.getBySel('core-course').should('have.length', coreCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCourses[index]);
        });
        cy.log('**** 2.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'No reserved courses for the coming semester.');
        cy.log('**** 2.4 Verify course offerings display');
        cy.getBySelMultiple('course-offering').should('have.length', 10)
        cy.getBySel('course-code').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Codes[index]);
        });
        cy.getBySel('course-title').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Titles[index]);
        });
        cy.getBySel('course-credits').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Credits[index] + ' credit');
        });
        cy.log('**** 2.5 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', coreCourseOfferingCodes.length).each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            expect(coreCourseOfferingCodes).to.include(courseCode);
        });
        cy.log('**** 2.6 Verify Reserve buttons');
        //  No Reserve buttons should be displayed or they are hidden
        cy.shouldBeInvisible('[data-cy="button-reserve"]');
        cy.shouldBeInvisible('[data-cy="button-remove"]');
    });


    it(`TC-PBI9-2 : • with reservations and plan declaration`, () => {
        cy.log('===================== TC-PBI9-2 =====================');
        cy.log('>>> With reservations and plan declaration');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-28T01:59:59Z'; // one second before startDateTime of the second period
        let studentId = '67130500140'; // Somchai Jaidee
        const coreCourses = [
            'INT240 Advanced Programming Concepts',
            'INT241 Data Structures and Algorithms',
            'INT242 Java Programming',
            'INT250 CSS Framework',
            'INT251 Frontend Development Framework',
            'INT261 Backend Development Framework',
        ];
        const coreCourseOfferingCodes = [
            'INT241',
            'INT242',
            'INT250',
        ];
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT242 Java Programming (3 credits)',
        ];

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second before startDateTime of the second period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 1.1 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer')
            .and('contain.text', 'on 11/11/2025, 00:18:19 (Asia/Bangkok)');
        cy.log('**** 1.2 Verify core courses for Full-Stack Developer');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for Full-Stack Developer');
        cy.getBySel('core-course').should('have.length', coreCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCourses[index]);
        });
        cy.log('**** 1.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 6');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 1.4 Verify course offerings display');
        cy.getBySelMultiple('course-offering').should('have.length', 10)
        cy.getBySel('course-code').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Codes[index]);
        });
        cy.getBySel('course-title').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Titles[index]);
        });
        cy.getBySel('course-credits').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Credits[index] + ' credit');
        });
        cy.log('**** 1.5 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', coreCourseOfferingCodes.length).each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            expect(coreCourseOfferingCodes).to.include(courseCode);
        });
        cy.log('**** 1.6 Verify Reserve buttons');
        cy.shouldBeInvisible('[data-cy="button-reserve"]');
        cy.shouldBeInvisible('[data-cy="button-remove"]');

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to startDateTime of the second period');
        testTime = '2025-11-28T02:00:00Z'; // at startDateTime of the second period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Reload reserve.html page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Declared FS - Full-Stack Developer')
            .and('contain.text', 'on 11/11/2025, 00:18:19 (Asia/Bangkok)');
        cy.log('**** 2.2 Verify core courses for Full-Stack Developer');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for Full-Stack Developer');
        cy.getBySel('core-course').should('have.length', coreCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCourses[index]);
        });
        cy.log('**** 2.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 6 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 2.4 Verify course offerings display');
        cy.getBySelMultiple('course-offering').should('have.length', 10)
        cy.getBySel('course-code').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Codes[index]);
        });
        cy.getBySel('course-title').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Titles[index]);
        });
        cy.getBySel('course-credits').should('have.length', 10).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS3Credits[index] + ' credit');
        });
        cy.log('**** 2.5 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', coreCourseOfferingCodes.length).each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            expect(coreCourseOfferingCodes).to.include(courseCode);
        });
        cy.log('**** 2.6 Verify Reserve buttons');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (['INT241', 'INT242'].includes(courseCode)) {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            } else {
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
            }
        });
    });

    it(`TC-PBI9-3 : • no reservations / no plan declaration
                    • core courses section / highlight change with declared plan change
                    • reserved course / buttons behavior`, () => {
        cy.log('===================== TC-PBI9-3 =====================');
        cy.log('>>> With no reservations / no plan declaration');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-25T01:59:59Z'; // one second before startDateTime of the first period
        let studentId = '67130500147'; // Somchaiwat Boondee
        const coreCoursesUX = [
            'INT220 UX Design',
            'INT221 UI Design',
            'INT222 UX/UI Measurement and Analysis'
        ];
        const coreCourseOfferingCodesUX = [
            'INT220',
        ];
        const coreCoursesBE = [
            'INT240 Advanced Programming Concepts',
            'INT241 Data Structures and Algorithms',
            'INT242 Java Programming',
            'INT261 Backend Development Framework'
        ];
        const coreCourseOfferingCodesBE = [
            'INT241',
            'INT242'
        ];
        const reservedCourses = [];

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second before startDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 1.1 Verify declaration status');
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.satisfy(t => t.includes('Not Declared') || t.includes('Cancelled'));
        });
        cy.log('**** 1.2 Verify no core courses shown');
        cy.getBySel('core-courses-header').should('not.exist');
        cy.getBySel('core-course').should('not.exist');
        cy.log('**** 1.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'No reserved courses for the coming semester.');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length);
        cy.log('**** 1.4 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', 0);
        cy.log('**** 1.5 Verify Reserve buttons');
        cy.shouldBeInvisible('[data-cy="button-reserve"]');
        cy.shouldBeInvisible('[data-cy="button-remove"]');

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to startDateTime of the first period');
        testTime = '2025-11-25T02:00:00Z'; // at startDateTime of the first period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Reload reserve.html page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify declaration status');
        cy.get('.ecors-declared-plan').invoke('text').then(text => {
            expect(text).to.satisfy(t => t.includes('Not Declared') || t.includes('Cancelled'));
        });
        cy.log('**** 2.2 Verify no core courses shown');
        cy.getBySel('core-courses-header').should('not.exist');
        cy.getBySel('core-course').should('not.exist');
        cy.log('**** 2.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 0 / 9');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 2.4 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', 0)
        cy.log('**** 2.5 Verify Reserve buttons');
        cy.getBySel('button-reserve').should('have.length', 10).each(($el) => {
            cy.wrap($el).should('be.enabled').and('contain.text', 'Reserve');
        });

        cy.log('* ');
        cy.log('* Step 5: Declare UX');
        cy.intercept('POST', '**/students/**').as('declarePlan');
        cy.get('.ecors-dropdown-plan').select('UX - UX/UI Designer');
        cy.get('.ecors-button-declare').click();
        cy.wait('@declarePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
            expect(response.body.planId).to.equal(9);
            expect(response.body.status).to.equal('DECLARED');
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 3.1 Verify declaration status after declaring UX');
        cy.get('.ecors-declared-plan').contains('Declared UX - UX/UI Designer');
        cy.log('**** 3.2 Verify core courses for UX/UI Designer after declaring UX');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for UX/UI Designer');
        cy.getBySel('core-course').should('have.length', coreCoursesUX.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCoursesUX[index]);
        });
        cy.log('**** 3.3 Verify highlighted courses after declaring UX');
        cy.getBySelMultiple('course-core').should('have.length', coreCourseOfferingCodesUX.length).each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            expect(coreCourseOfferingCodesUX).to.include(courseCode);
        });

        cy.log('* ');
        cy.log('* Step 6: Change declared plan to BE');
        cy.intercept('PUT', '**/students/**').as('changePlan');
        cy.get('.ecors-dropdown-plan').select('BE - Backend Developer');
        cy.log('**** 6.1 Still show UX core courses');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for UX/UI Designer');
        cy.getBySel('core-course').should('have.length', coreCoursesUX.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCoursesUX[index]);
        });
        
        cy.log('* Step 7: Click Change Plan button');
        cy.get('.ecors-button-change').click();
        cy.wait('@changePlan').then(({ request, response }) => {
            expect(response.statusCode).to.equal(200);
            expect(response.body.planId).to.equal(2);
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 4.1 Verify declaration status after changing to BE');
        cy.get('.ecors-declared-plan').contains('Declared BE - Backend Developer');
        cy.log('**** 4.2 Verify core courses for BE Developer after changing to BE');
        cy.getBySel('core-courses-header').should('exist').and('be.visible')
            .and('contain.text', 'Core Courses for Backend Developer');
        cy.getBySel('core-course').should('have.length', coreCoursesBE.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', coreCoursesBE[index]);
        });
        cy.log('**** 4.3 Verify highlighted courses after changing to BE');
        cy.getBySelMultiple('course-core').should('have.length', coreCourseOfferingCodesBE.length).each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            expect(coreCourseOfferingCodesBE).to.include(courseCode);
        });

        cy.log('* ');
        cy.log('* Step 8: Cancel Declared Plan');
        cy.get('.ecors-button-cancel:not(.ecors-dialog .ecors-button-cancel)').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.intercept('DELETE', '**/students/**').as('cancelPlan');
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
        cy.log('**** 5.1 Verify declaration status after cancelling plan');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Cancelled BE - Backend Developer');
        cy.log('**** 5.2 Verify no core courses shown after cancelling plan');
        cy.getBySel('core-courses-header').should('not.exist');
        cy.getBySel('core-course').should('not.exist');
        cy.log('**** 5.3 Verify highlighted courses after cancelling plan');
        cy.getBySelMultiple('course-core').should('have.length', 0)

        cy.log('* ');
        cy.log('* Step 9: Reserve INT292');
        cy.intercept('POST', '**/reservations').as('reserveCourse');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT292') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.wait('@reserveCourse').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 6.1 Verify reserved courses after reserving INT292');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 1 / 9');
        cy.getBySel('course-reserved').should('have.length', 1).each(($el) => {
            cy.wrap($el).should('contain.text', 'INT292 Query Processing Concepts (1 credit');
        });
        cy.log('**** 6.2 Verify Reserve button for INT292 is now disabled');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (courseCode === 'INT292') {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            }
        });
        cy.log('* ');
        cy.log('* Step 10: Reserve INT241');
        cy.intercept('POST', '**/reservations').as('reserveCourse2');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT241') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.wait('@reserveCourse2').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 7.1 Verify reserved courses after reserving INT241');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 4 / 9');
        cy.getBySel('course-reserved').should('have.length', 2).each(($el, index) => {
            const expectedCourse = index === 0 ? 'INT241 Data Structures and Algorithms (3 credits)' : 'INT292 Query Processing Concepts (1 credit';
            cy.wrap($el).should('contain.text', expectedCourse);
        });
        cy.log('**** 7.2 Verify Reserve button for INT241 is now disabled');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (courseCode === 'INT241') {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            }
        });
    });    


    it(`TC-PBI9-4 : • Perform action after the reservation period is closed 
                    • Reserve – failed`, () => {
        cy.log('===================== TC-PBI9-4 =====================');
        cy.log('>>> Perform action after the reservation period is closed • Reserve – failed');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-27T10:59:59Z'; // one second before endDateTime of the first period
        const studentId = '67130500147'; // Somchaiwat Boondee
        const expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 28/11/2025 09:00 – 01/12/2025 17:00 (Asia/Bangkok)"
        };
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT292 Query Processing Concepts (1 credit',
        ];

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second before endDateTime of the first period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to one second after endDateTime of the first period');
        testTime = '2025-11-27T11:00:01Z'; // one second after endDateTime of the first period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Attempt to Reserve INT242');
        cy.intercept('POST', '**/reservations').as('reserveCourse');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT242') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('contain.text', 'Reserve');
                button.click({ force: true });
            }
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.get('@reserveCourse.all').should('have.length', 0, 'Reserve request should not be sent to BE'); // FE does not send request to BE
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");

        cy.log('* ');
        cy.log('* Step 5: Click OK on the error dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.3 Verify reserve.html is reloaded');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 2.4 Verify Declaration section is hidden');
        cy.declarationSectionShouldBeHidden();
        cy.log('**** 2.7 Verify Reserved Courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 4');
        cy.getBySel('course-reserved').should('have.length', 2).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
    });


    it(`TC-PBI9-5 : • with reservations / cancelled plan declaration
                    • reserved course / buttons behavior`, () => {
        cy.log('===================== TC-PBI9-5 =====================');
        cy.log('>>> With reservations / cancelled plan declaration');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-28T02:00:00Z'; // at startDateTime of the second period
        let studentId = '67130500147'; // Somchaiwat Boondee
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT292 Query Processing Concepts (1 credit'
        ];
        const reservedCourses2 = [...reservedCourses, 'INT242 Java Programming (3 credits)'].sort();
        const reservedCourses3 = [...reservedCourses2, 'INT290 Advanced SQL (1 credit'].sort();
        const reservedCourses4 = [...reservedCourses3, 'INT250 CSS Framework (3 credits)'].sort();

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to startDateTime of the second period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 1.1 Verify declaration status');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Cancelled BE - Backend Developer')
        cy.log('**** 1.2 Verify no core courses shown');
        cy.getBySel('core-courses-header').should('not.exist');
        cy.getBySel('core-course').should('not.exist');
        cy.log('**** 1.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 4 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('* ');
        cy.log('* Step 3: Reserve INT242');
        cy.intercept('POST', '**/reservations').as('reserveCourse');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT242') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.wait('@reserveCourse').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 2.1 Verify reserved courses after reserving INT242');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 7 / 12');
        cy.getBySel('course-reserved').should('have.length', 3).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses2[index]);
        });
        cy.log('**** 2.2 Verify Reserve button for INT242 is now disabled');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (courseCode === 'INT242') {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            }
        });

        cy.log('* ');
        cy.log('* Step 4: Reserve INT290');
        cy.intercept('POST', '**/reservations').as('reserveCourse2');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT290') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.wait('@reserveCourse2').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 3.1 Verify reserved courses after reserving INT290');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 8 / 12');
        cy.getBySel('course-reserved').should('have.length', 4).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses3[index]);
        });
        cy.log('**** 3.2 Verify Reserve button for INT290 is now disabled');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (courseCode === 'INT290') {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            }
        });

        cy.log('* ');
        cy.log('* Step 5: Reserve INT250');
        cy.intercept('POST', '**/reservations').as('reserveCourse3');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT250') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.wait('@reserveCourse3').then(({ request, response }) => {
            expect(response.statusCode).to.equal(201);
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 4.1 Verify reserved courses after reserving INT250');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 11 / 12');
        cy.getBySel('course-reserved').should('have.length', 5).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses4[index]);
        });
        cy.log('**** 4.2 Verify only Reserve buttons on INT282 and INT291 are enable');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (['INT282', 'INT291'].includes(courseCode)) {
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
            } else {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            }
        });

        cy.log('* ');
        cy.log('* Step 6: Advance FE/BE clocks to one second after endDateTime of the second period');
        testTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 7: Reload reserve.html page');
        cy.reload();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reserved courses after reservation period is closed');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 11');
        cy.getBySel('course-reserved').should('have.length', 5).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses4[index]);
        });
        cy.log('**** 5.2 Verify all Reserve buttons are not shown');
        cy.shouldBeInvisible('[data-cy="button-reserve"]');
        cy.shouldBeInvisible('[data-cy="button-remove"]');
    });


    it(`TC-PBI9-6 : • at startDateTime of 2025S2`, () => {
        cy.log('===================== TC-PBI9-6 =====================');
        cy.log('>>> at startDateTime of 2025S2');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2026-01-12T00:00:00Z'; // at startDateTime of 2026S2
        let studentId = '67130500147'; // Somchaiwat Boondee
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "Next reservation period:",
            "next-period": "Period: 04/03/2026 09:00 – 06/03/2026 18:30 (Asia/Bangkok)"
        };

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to startDateTime of 2026S2');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('**** 2.1 Verify reservation periods information');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify Declaration section is hidden');
        cy.declarationSectionShouldBeHidden();
        cy.log('**** 2.3 Verify no Reserved Courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'No reserved courses for the coming semester.');
        cy.getBySel('course-reserved').should('have.length', 0);
        cy.log('**** 2.4 Verify 9 course offerings (id 11–19)');
        cy.getBySel('course-code').should('have.length', 9).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS4Codes[index]);
        });
        cy.getBySel('course-title').should('have.length', 9).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS4Titles[index]);
        });
        cy.getBySel('course-credits').should('have.length', 9).each(($el, index) => {
            cy.wrap($el).should('contain.text', courseOfferingsS4Credits[index] + ' credit');
        });
        cy.getBySelMultiple('course-offering').should('have.length', 9);
        cy.log('**** 2.5 Verify no highlight');
        cy.getBySelMultiple('course-core').should('have.length', 0);
        cy.log('**** 2.6 Verify no Reserve buttons');
        cy.shouldBeInvisible('[data-cy="button-reserve"]');
        cy.shouldBeInvisible('[data-cy="button-remove"]');
    });

 
   it(`TC-PBI9-7 : 409 errors on course reservation`, () => {
        cy.log('===================== TC-PBI9-7 =====================');
        cy.log('>>> 409 errors on course reservation');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-28T13:00:00Z'; // during the second reservation period
        let studentId = '67130500148'; // Somlak Meesuk 
        const reservedCourses = [
            "INT241 Data Structures and Algorithms (3 credits)",
            "INT242 Java Programming (3 credits)",
            "INT270 Mathematics for Artificial Intelligence (3 credits)"        
        ];
        
        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to during the second reservation period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 1.1 Verify declaration status and reserved courses');
        cy.get('.ecors-declared-plan').should('exist').and('be.visible')
            .and('contain.text', 'Not Declared');
        cy.log('**** 1.2 Verify no core courses shown');
        cy.getBySel('core-courses-header').should('not.exist');
        cy.getBySel('core-course').should('not.exist');
        cy.log('**** 1.3 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 9 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });        
        cy.log('**** 1.4 Verify highlighted courses');
        cy.getBySelMultiple('course-core').should('have.length', 0);
        cy.log('**** 1.5 Verify Reserve buttons');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            const button = cy.findButton($el, 'button-reserve');
            if (['INT241', 'INT242', 'INT270'].includes(courseCode)) {
                button.should('exist').and('be.disabled').and('contain.text', 'Reserve');
            } else {
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
            }
        });
        
        cy.log('* ');
        cy.log('* Step 3: Reserve INT250 but send INT241 - expect ALREADY_RESERVED error');
        cy.intercept({ method: 'POST', url: '**/reservations', times: 1 }, (req) => {
            req.body.courseOfferingId = 2; // INT241
        }).as('reserveCourse1');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT250') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.log('**** 2.1 Verify BE response with 409 ALREADY_RESERVED');
        cy.wait('@reserveCourse1').then(({ request, response }) => {
            expect(response.statusCode).to.equal(409);
            cy.fixture('reservations/409-already-reserved.json').then((expected) => {
                expect(response.body).to.include(expected)});
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.2 Verify FE show dialog with ALREADY_RESERVED message');
        cy.shouldShowDialog("A reservation already exists for this course offering.");
        });

        cy.log('* ');
        cy.log('* Step 4: Click OK on the ALREADY_RESERVED dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 3.1 Verify reserve.html is reloaded with no reservation on INT241');
        cy.getBySel('reservation-message').should('contain.text', 'Total Credits Reserved: 9 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });

        cy.log('* ');
        cy.log('* Step 5: Reserve INT250 and mock CREDIT_LIMIT_EXCEEDED error');
        cy.intercept('POST', '**/reservations', (req) => {
            req.reply({ statusCode: 409, fixture: 'reservations/409-credit-limit-exceeded.json' });
        }).as('reserveCourse2');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT250') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.log('**** 4.1 Verify BE response with 409 CREDIT_LIMIT_EXCEEDED');
        cy.wait('@reserveCourse2').then(({ request, response }) => {
            expect(response.statusCode).to.equal(409);
            cy.fixture('reservations/409-credit-limit-exceeded.json').then((expected) => {
                expect(response.body).to.include(expected)});
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.2 Verify FE show dialog with CREDIT_LIMIT_EXCEEDED message');
        cy.shouldShowDialog("Reserving this course would exceed the cumulative credit limit for the current reservation period.");
        });

        cy.log('* ');
        cy.log('* Step 6: Click OK on the CREDIT_LIMIT_EXCEEDED dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reserve.html is reloaded with no reservation on INT250');
        cy.getBySel('reservation-message').should('contain.text', 'Total Credits Reserved: 9 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });  

        cy.log('* ');
        cy.log('* Step 7: Reserve INT250 and mock COURSE_NOT_OFFERRED_IN_PERIOD error');
        cy.intercept('POST', '**/reservations', (req) => {
            req.reply({ statusCode: 409, fixture: 'reservations/409-course-not-offered-in-period.json' });
        }).as('reserveCourse3');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT250') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.log('**** 4.1 Verify BE response with 409 COURSE_NOT_OFFERRED_IN_PERIOD');
        cy.wait('@reserveCourse3').then(({ request, response }) => {
            expect(response.statusCode).to.equal(409);
            cy.fixture('reservations/409-course-not-offered-in-period.json').then((expected) => {
                expect(response.body).to.include(expected)});
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.2 Verify FE show dialog with COURSE_NOT_OFFERRED_IN_PERIOD message');
        cy.shouldShowDialog("This course offering is not in the same semester as the current reservation period.");
        });

        cy.log('* ');
        cy.log('* Step 6: Click OK on the COURSE_NOT_OFFERRED_IN_PERIOD dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reserve.html is reloaded with no reservation on INT250');
        cy.getBySel('reservation-message').should('contain.text', 'Total Credits Reserved: 9 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });  
    });


    it(`TC-PBI9-8 : • Client time is slower than server by 5 seconds
                    • Reserve – failed`, () => {
        cy.log('===================== TC-PBI9-8 =====================');
        cy.log('>>> Client time is slower than server by 5 seconds • Reserve – failed');
        cy.log('=====================================================');
        // Declare test variables
        const studentId = '67130500148'; // Somlak Meesuk
        let serverTime = '2025-12-01T09:59:56Z'; // at 4 second before endDateTime of the second period
        let clientTime = '2025-12-01T09:59:51Z'; // at 9 seconds before endDateTime of the second period
        const reservedCourses = [
            "INT241 Data Structures and Algorithms (3 credits)",
            "INT242 Java Programming (3 credits)",
            "INT270 Mathematics for Artificial Intelligence (3 credits)"        
        ];

        cy.log('* ');
        cy.log('* Step 1: Set BE clocks to 4 seconds before endDateTime of the second period. Set FE clocks to 9 seconds before endDateTime of the second period');
        cy.setServerTime(serverTime);
        cy.clock(new Date(clientTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 1.1 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 9 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });        
        cy.log('* ');
        cy.log('* Step 3: Advance BE clocks to 1 second after endDateTime of the second period. Advance FE clocks to 6 seconds before endDateTime of the second period');
        serverTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        clientTime = '2025-12-01T09:59:56Z'; // at 4 seconds before endDateTime of the second period
        cy.setServerTime(serverTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(clientTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Attempt to Reserve INT250');
        cy.intercept('POST', '**/reservations').as('reserveCourse4');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT250') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('contain.text', 'Reserve');
                button.click({ force: true });
            }
        });
        cy.log('**** 4.1 Verify BE response with 403');
        cy.wait('@reserveCourse4').then(({ request, response }) => {
            expect(response.statusCode).to.equal(403);
            cy.fixture('reservations/403-reservation-period-closed.json').then((expected) => {
                expect(response.body).to.include(expected)});
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.2 Verify FE show dialog "Cannot perform this action because the reservation period is currently closed."');
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");

        cy.log('* ');
        cy.log('* Step 5: Click OK on the error dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reserve.html is reloaded with no reservation on INT250');
        cy.getBySel('reservation-message').should('have.text', 'Total Credits Reserved: 9');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
    });
});