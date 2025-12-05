describe('PBI10 : CHANGE-RESERVED-COURSES', () => {

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
        cy.intercept({ method: 'GET', url: '**/study-plans', times: 1 }).as('getStudyPlans');
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


    it(`TC-PBI10-1 : • cancel removal – success`, () => {
        cy.log('===================== TC-PBI10-1 =====================');
        cy.log('>>> cancel removal - success');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-25T01:59:59Z'; // one second before startDateTime of the first period
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
        cy.log(`* Step 1: Set FE/BE clock to ${testTime}`);
        const step1Time = new Date(testTime).getTime();
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 6');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 2.2 Verify Reserve buttons');
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
        cy.log('**** 4.1 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 6 / 9');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 4.2 Verify Reserve and Remove buttons');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            cy.log('Checking course code: ' + courseCode);
            const reserveButton = cy.findButton($el, 'button-reserve');
            const removeButton = cy.findButton($el, 'button-remove');
            if (['INT241', 'INT242'].includes(courseCode)) {
                cy.log('  -> should have Remove button and disabled Reserve button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.should('exist').and('be.enabled').and('contain.text', 'Remove');
            } else {
                cy.log('  -> should have enabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            }
        });

        cy.log('* ');
        cy.log('* Step 5: Click "Remove" button on INT241');
        cy.log('Finding course offering INT241');
        cy.intercept({ method: 'DELETE', url: '**/reservations/**' }).as('removeCourse');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT241') {
                cy.log('Clicking Remove button for ' + courseCode);
                cy.findButton($el, 'button-remove').click();
            }
        });
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.log('**** 5.1. Verify removal confirmation dialog');
        cy.get('.ecors-dialog').should('exist').and('be.visible')
            .and('contain.text', 'Are you sure you want to remove INT241 Data Structures and Algorithms?');
        cy.get('.ecors-dialog-button-remove').should('exist').and('be.visible').and('have.text', 'Remove');
        cy.get('.ecors-dialog-button-cancel').should('exist').and('be.visible').and('have.text', 'Cancel');

        cy.log('* ');
        cy.log('* Step 6: Click "Cancel" on the dialog');
        cy.get('.ecors-dialog-button-cancel').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.log('**** 6.1 Verify dialog is dismissed');
        cy.get('.ecors-dialog').should('not.have.attr', 'open');
        cy.log('**** 6.2 Verify no DELETE request is sent to Backend');
        cy.get('@removeCourse.all').should('have.length', 0, 'No DELETE request should be sent when canceling removal');
        cy.log('**** 6.3 Verify INT241 is still shown in Reserved Courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 6 / 9');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => { cy.wrap($el).should('contain.text', reservedCourses[index]); });
    });


    it(`TC-PBI10-2 : • remove 1 credit course – success`, () => {
        cy.log('===================== TC-PBI10-2 =====================');
        cy.log('>>> remove 1 credit course - success');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-28T02:00:00Z'; // during the second period
        let studentId = '67130500147'; // Somchaiwat Boondee
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT242 Java Programming (3 credits)',
            'INT250 CSS Framework (3 credits)',
            'INT290 Advanced SQL (1 credits)',
            'INT292 Query Processing Concepts (1 credits)',
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
        cy.log('**** 2.1 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 11 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 2.2 Verify Reserve and Remove buttons');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            cy.log('Checking course code: ' + courseCode);
            const reserveButton = cy.findButton($el, 'button-reserve');
            const removeButton = cy.findButton($el, 'button-remove');
            if (['INT241', 'INT242', 'INT250', 'INT290', 'INT292'].includes(courseCode)) {
                cy.log('  -> should have Remove button and disabled Reserve button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.should('exist').and('be.enabled').and('contain.text', 'Remove');
            } else if (['INT282', 'INT291'].includes(courseCode)) {
                cy.log('  -> should have enabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            } else {
                cy.log('  -> should have disabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            }
        });

        cy.log('* ');
        cy.log('* Step 3: Click "Remove" button on INT290');
        cy.log('Finding course offering INT290');
        cy.intercept({ method: 'DELETE', url: '**/reservations/**' }).as('removeCourse');
        cy.intercept({ method: 'GET', url: '**/reservations' }).as('getReservationsAfterRemoval');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT290') {
                cy.log('Clicking Remove button for ' + courseCode);
                cy.findButton($el, 'button-remove').click();
            }
        });
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.log('**** 3.1. Verify removal confirmation dialog');
        cy.get('.ecors-dialog').should('exist').and('be.visible')
            .and('contain.text', 'Are you sure you want to remove INT290 Advanced SQL?');
        cy.get('.ecors-dialog-button-remove').should('exist').and('be.visible').and('have.text', 'Remove');
        cy.get('.ecors-dialog-button-cancel').should('exist').and('be.visible').and('have.text', 'Cancel');

        cy.log('* ');
        cy.log('* Step 4: Click "Remove" on the dialog');
        cy.get('.ecors-dialog-button-remove').click();
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.log('**** 4.1 Verify dialog is dismissed');
        cy.get('.ecors-dialog').should('not.have.attr', 'open');
        cy.log('**** 4.2 Verify a DELETE request is sent to Backend');
        cy.wait('@removeCourse').its('response.statusCode').should('eq', 204);
        cy.log('**** 4.2 Verify a GET request is NOT sent to Backend to refresh reserved courses');
        cy.get('@getReservationsAfterRemoval.all').should('have.length', 0, 'No GET request should be sent to refresh reserved courses after removal');
        cy.log('**** 4.3 Verify INT290 is removed from Reserved Courses');
        const updatedReservedCourses = reservedCourses.filter(course => !course.startsWith('INT290'));
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 10 / 12');
        cy.getBySel('course-reserved').should('have.length', updatedReservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', updatedReservedCourses[index]);
        });
        cy.log('**** 4.4 Verify Reserve and Remove buttons');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            cy.log('Checking course code: ' + courseCode);
            const reserveButton = cy.findButton($el, 'button-reserve');
            const removeButton = cy.findButton($el, 'button-remove');
            if (['INT241', 'INT242', 'INT250', 'INT292'].includes(courseCode)) {
                cy.log('  -> should have Remove button and disabled Reserve button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.should('exist').and('be.enabled').and('contain.text', 'Remove');
            } else if (['INT282', 'INT290', 'INT291'].includes(courseCode)) {
                cy.log('  -> should have enabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            } else {
                cy.log('  -> should have disabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            }
        });
    });


    it(`TC-PBI10-3 : • remove remaining courses – success`, () => {
        cy.log('===================== TC-PBI10-3 =====================');
        cy.log('>>> remove remaining courses - success');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-12-01T09:59:59Z'; // one second before endDateTime of the second period
        let studentId = '67130500147'; // Somchaiwat Boondee
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT242 Java Programming (3 credits)',
            'INT250 CSS Framework (3 credits)',
            'INT292 Query Processing Concepts (1 credits)',
        ];

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second before endDateTime of the second period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 10 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 2.2 Verify Reserve and Remove buttons');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            cy.log('Checking course code: ' + courseCode);
            const reserveButton = cy.findButton($el, 'button-reserve');
            const removeButton = cy.findButton($el, 'button-remove');
            if (['INT241', 'INT242', 'INT250', 'INT292'].includes(courseCode)) {
                cy.log('  -> should have Remove button and disabled Reserve button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.should('exist').and('be.enabled').and('contain.text', 'Remove');
            } else if (['INT282', 'INT290', 'INT291'].includes(courseCode)) {
                cy.log('  -> should have enabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            } else {
                cy.log('  -> should have disabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            }
        });

        cy.log('* ');
        cy.log('* Step 3: Remove all remaining reserved courses one by one');
        const coursesToRemove = ['INT242', 'INT292', 'INT250', 'INT241'];
        cy.intercept({ method: 'DELETE', url: '**/reservations/**' }).as('removeCourse');
        cy.intercept({ method: 'GET', url: '**/reservations' }).as('getReservationsAfterRemoval');
        coursesToRemove.forEach((courseCode) => {
            cy.log(`* Removing course ${courseCode}`);
            cy.getBySelMultiple('course-offering').each(($el) => {
                const coCode = $el.find('[data-cy="course-code"]').text().trim();
                if (coCode === courseCode) {
                    cy.log('Clicking Remove button for ' + coCode);
                    cy.findButton($el, 'button-remove').click();
                }
            });
            cy.wait(Cypress.config('dialogWaitMs'));
            cy.log('**** Verify removal confirmation dialog');
            let courseTitle = '';
            switch (courseCode) {
                case 'INT241': courseTitle = 'Data Structures and Algorithms'; break;
                case 'INT242': courseTitle = 'Java Programming'; break;
                case 'INT250': courseTitle = 'CSS Framework'; break;
                case 'INT292': courseTitle = 'Query Processing Concepts'; break;
            }
            cy.get('.ecors-dialog').should('exist').and('be.visible')
                .and('contain.text', `Are you sure you want to remove ${courseCode} ${courseTitle}?`);
            cy.get('.ecors-dialog-button-remove').should('exist').and('be.visible').and('have.text', 'Remove');
            cy.get('.ecors-dialog-button-cancel').should('exist').and('be.visible').and('have.text', 'Cancel');

            cy.log('* ');
            cy.log('* Confirming removal on the dialog');
            cy.get('.ecors-dialog-button-remove').click();
            cy.wait(Cypress.config('dialogWaitMs'));
            cy.log('**** Verify dialog is dismissed');
            cy.get('.ecors-dialog').should('not.have.attr', 'open');
            cy.log('**** Verify a DELETE request is sent to Backend');
            cy.wait('@removeCourse').its('response.statusCode').should('eq', 204);
        });
        cy.log('**** 3.1 Verify a GET request is NOT sent to Backend to refresh reserved courses');
        cy.get('@getReservationsAfterRemoval.all').should('have.length', 0, 'No GET request should be sent to refresh reserved courses after removal');

        cy.log('**** Final Verification: All reserved courses are removed');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 0 / 12');
        cy.getBySel('course-reserved').should('have.length', 0);
        cy.log('**** Final Verification: All Reserve buttons are enabled and no Remove button');
        cy.getBySel('button-reserve').should('exist').and('be.visible').and('have.length', 10).each(($btn) => {
            cy.wrap($btn).should('be.enabled').and('contain.text', 'Reserve');
        });
        cy.getBySel('button-remove').each(($btn) => {
            cy.wrap($btn).shouldBeHiddenOrDisabled('Remove button', 'Remove');
        });
    });


    it(`TC-PBI10-4 : Handles 404 errors on remove course reservation`, () => {
        cy.log('===================== TC-PBI10-4 =====================');
        cy.log('>>> Handles 404 errors on remove course reservation');
        cy.log('=====================================================');
        // Declare test variables
        const testTime = '2025-12-01T09:59:59Z'; // one second before endDateTime of the second period
        const studentId = '67130500146'; // Somkiet	Deejai
        const courseOfferingIdToAddAndRemove = 2; // INT241
        const reservedCoursesInitial = [];
        const reservedCoursesAfterReserve = [
            "INT241 Data Structures and Algorithms (3 credits)",
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
        cy.log('**** 2.1 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 0 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCoursesInitial.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCoursesInitial[index]);
        });
        cy.log('**** 2.2 Verify Reserve and Remove buttons');
        cy.getBySel('button-reserve').should('exist').and('be.visible').and('have.length', 10).each(($btn) => {
            cy.wrap($btn).should('be.enabled').and('contain.text', 'Reserve');
        });
        cy.getBySel('button-remove').each(($btn) => {
            cy.wrap($btn).shouldBeHiddenOrDisabled('Remove button', 'Remove');
        });

        cy.log('* ');
        cy.log('**** Step 2.3: Reserve INT241');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT241') {
                const button = cy.findButton($el, 'button-reserve');
                button.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                button.click();
            }
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.closeDialogIfPresent();
        cy.log('**** 2.4 Verify reserved courses after reserving INT241');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('contain.text', 'Total Credits Reserved: 3 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCoursesAfterReserve.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCoursesAfterReserve[index]);
        });
        cy.log('**** 2.5 Verify Reserve and Remove buttons after reserving INT241');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            cy.log('Checking course code: ' + courseCode);
            const reserveButton = cy.findButton($el, 'button-reserve');
            const removeButton = cy.findButton($el, 'button-remove');
            if (courseCode === 'INT241') {
                cy.log('  -> should have Remove button and disabled Reserve button');
                reserveButton.should('exist').and('be.disabled').and('contain.text', 'Reserve');
                removeButton.should('exist').and('be.enabled').and('contain.text', 'Remove');
            } else {
                cy.log('  -> should have disabled Reserve button and no Remove button');
                reserveButton.should('exist').and('be.enabled').and('contain.text', 'Reserve');
                removeButton.shouldBeHiddenOrDisabled(`Remove button for ${courseCode}`, 'Remove');
            }
        });

        cy.log('* ');
        cy.log('* Step 2.6: Send DELETE /reservations/{courseOfferingId} to remove INT241');
        cy.request({
            method: 'DELETE',
            url: `${Cypress.env('baseAPI')}/students/${studentId}/reservations/${courseOfferingIdToAddAndRemove}`
        }).then((response) => {
            expect(response.status).to.eq(204);
        });

        cy.log('* ');
        cy.log('* Step 3: Click Remove INT241 - expect RESERVATION_NOT_FOUND error');
        cy.intercept({ method: 'DELETE', url: '**/reservations/**' }).as('removeCourse');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT241') {
                const button = cy.findButton($el, 'button-remove');
                button.should('exist').and('be.enabled').and('contain.text', 'Remove');
                button.click();
            }
        });
        cy.get('.ecors-dialog').should('exist').and('be.visible')
            .and('contain.text', `Are you sure you want to remove INT241 Data Structures and Algorithms?`);
        cy.get('.ecors-dialog-button-remove').should('exist').and('be.visible').and('have.text', 'Remove').click();

        cy.log('**** 3.1 Verify BE response with 404 RESERVATION_NOT_FOUND');
        cy.wait('@removeCourse').then(({ request, response }) => {
            expect(response.statusCode).to.equal(404);
            expect(response.body).to.include({
                "error": "RESERVATION_NOT_FOUND",
                "message": `No reservation found for student with id=${studentId} and course offering id=${courseOfferingIdToAddAndRemove}.`
            });
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 3.2 Verify FE show dialog with RESERVATION_NOT_FOUND message');
        cy.shouldShowDialog(`No reservation found for student with id=${studentId} and course offering id=${courseOfferingIdToAddAndRemove}.`);

        cy.log('* ');
        cy.log('* Step 4: Click OK on the RESERVATION_NOT_FOUND dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.1 Verify reserved courses are updated correctly');
        cy.getBySel('reservation-message').should('contain.text', 'Total Credits Reserved: 0 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCoursesInitial.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCoursesInitial[index]);
        });
        cy.log('**** 4.2 Verify Reserve and Remove buttons');
        cy.getBySel('button-reserve').should('exist').and('be.visible').and('have.length', 10).each(($btn) => {
            cy.wrap($btn).should('be.enabled').and('contain.text', 'Reserve');
        });
        cy.getBySel('button-remove').each(($btn) => {
            cy.wrap($btn).shouldBeHiddenOrDisabled('Remove button', 'Remove');
        });
    });


    it(`TC-PBI10-5 : • no 'Reserve' or 'Remove' buttons during 'Inactive' period`, () => {
        cy.log('===================== TC-PBI10-5 =====================');
        cy.log(">>> no 'Reserve' or 'Remove' buttons during 'Inactive' period");
        cy.log('=====================================================');
        // Declare test variables
        const testTime = '2025-12-02T04:00:00Z'; // during the Inactive period
        const studentId = '67130500140'; // Somchai Jaidee
        let expectedReservationPeriods = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT242 Java Programming (3 credits)',
        ];

        cy.log('* ');
        cy.log(`* Step 1: Set FE/BE clocks to ${testTime}`);
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 2.1 Verify Reservation Periods');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriods);
        cy.log('**** 2.2 Verify reserved courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 6');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
        cy.log('**** 2.3 Verify no Reserve or Remove buttons');
        cy.shouldBeInvisible('[data-cy="button-reserve"]');
        cy.shouldBeInvisible('[data-cy="button-remove"]');
    });


    it(`TC-PBI10-6 : • Perform action after the reservation period is closed 
                          • Remove – failed`, () => {
        cy.log('===================== TC-PBI10-6 =====================');
        cy.log('>>> Perform action after the reservation period is closed • Remove – failed');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-12-01T09:59:59Z'; // one second before endDateTime of the second period
        const studentId = '67130500140'; // Somchai Jaidee
        const expectedReservationPeriodsAfter = {
            "current-message": "Reservation is closed",
            "current-period": null,
            "next-message": "There are no upcoming active reservation periods.",
            "next-period": null
        };
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT242 Java Programming (3 credits)',
        ];

        cy.log('* ');
        cy.log('* Step 1: Set FE/BE clocks to one second before endDateTime of the second period');
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 3: Advance FE/BE clocks to one second after endDateTime of the second period');
        testTime = '2025-12-01T10:00:01Z'; // one second after endDateTime of the second period
        cy.setServerTime(testTime);
        cy.clock().then((clock) => clock.setSystemTime(new Date(testTime).getTime()));

        cy.log('* ');
        cy.log('* Step 4: Attempt to Remove INT241');
        cy.intercept('DELETE', '**/reservations/**').as('removeCourse');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT241') {
                const button = cy.findButton($el, 'button-remove');
                button.should('exist').and('contain.text', 'Remove');
                button.click({ force: true });
            }
        });
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.get('.ecors-dialog').should('exist').and('be.visible')
            .and('contain.text', `Are you sure you want to remove INT241 Data Structures and Algorithms?`);
        cy.get('.ecors-dialog-button-remove').should('exist').and('be.visible').and('have.text', 'Remove').click();
        cy.get('@removeCourse.all').should('have.length', 0, 'Remove request should not be sent to BE'); // FE does not send request to BE
        cy.wait(Cypress.config('regularWaitMs'));
        cy.shouldShowDialog("Cannot perform this action because the reservation period is currently closed.");

        cy.log('* ');
        cy.log('* Step 5: Click OK on the error dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify reserve.html is reloaded');
        cy.shouldBeExpectedReservationPeriods(expectedReservationPeriodsAfter);
        cy.log('**** 5.2 Verify Reserved Courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 6');
        cy.getBySel('course-reserved').should('have.length', 2).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
    });


    it(`TC-PBI10-7 : • Handles COURSE_NOT_OFFERRED_IN_PERIOD error on Remove`, () => {
        cy.log('===================== TC-PBI10-7 =====================');
        cy.log('>>> Handles COURSE_NOT_OFFERRED_IN_PERIOD error on Remove');
        cy.log('=====================================================');
        // Declare test variables
        let testTime = '2025-11-28T13:00:00Z'; // during the second period
        const studentId = '67130500140'; // Somchai Jaidee 
        const reservedCourses = [
            'INT241 Data Structures and Algorithms (3 credits)',
            'INT242 Java Programming (3 credits)',
        ];

        cy.log('* ');
        cy.log(`* Step 1: Set FE/BE clocks to ${testTime}`);
        cy.setServerTime(testTime);
        cy.clock(new Date(testTime).getTime(), ['Date']);

        cy.log('* ');
        cy.log(`* Step 2: Sign-in as ${studentId} and visit reserve.html`);
        cy.signIn(studentId, 'itbangmod');
        cy.visit('/reserve.html');
        cy.wait(Cypress.config('regularWaitMs'));

        cy.log('* ');
        cy.log('* Step 3: Click "Remove" button on INT241');
        cy.log('Finding course offering INT241');

        cy.log('**** Setting up intercept to modify DELETE /reservations/2 to /reservations/11 to trigger COURSE_NOT_OFFERRED_IN_PERIOD error');
        cy.intercept({ method: 'DELETE', url: '**/reservations/**' }, (req) => {
            req.url = req.url.replace(/\/2$/, '/11');
        }).as('removeCourseWithError');
        cy.getBySelMultiple('course-offering').each(($el) => {
            const courseCode = $el.find('[data-cy="course-code"]').text().trim();
            if (courseCode === 'INT241') {
                cy.log('Clicking Remove button for ' + courseCode);
                cy.findButton($el, 'button-remove').click();
            }
        });
        cy.wait(Cypress.config('dialogWaitMs'));
        cy.log('**** 3.1. Verify removal confirmation dialog');
        cy.get('.ecors-dialog').should('exist').and('be.visible')
            .and('contain.text', 'Are you sure you want to remove INT241 Data Structures and Algorithms?');
        cy.get('.ecors-dialog-button-remove').should('exist').and('be.visible').and('have.text', 'Remove');
        cy.get('.ecors-dialog-button-cancel').should('exist').and('be.visible').and('have.text', 'Cancel');

        cy.log('* ');
        cy.log('* Step 4: Click "Remove" on the dialog');
        cy.get('.ecors-dialog-button-remove').click();

        cy.log('**** 4.1 Verify BE response with 409 COURSE_NOT_OFFERRED_IN_PERIOD');
        cy.wait('@removeCourseWithError').then(({ request, response }) => {
            expect(response.statusCode).to.equal(409);
            cy.fixture('reservations/409-course-not-offered-in-period.json').then((errorResponse) => {
                expect(response.body).to.include(errorResponse);
            });
        });
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 4.2 Verify FE show dialog with COURSE_NOT_OFFERRED_IN_PERIOD message');
        cy.shouldShowDialog("This course offering is not in the same semester as the current reservation period.");

        cy.log('* ');
        cy.log('* Step 5: Click OK on the COURSE_NOT_OFFERRED_IN_PERIOD dialog');
        cy.get('.ecors-button-dialog').click();
        cy.shouldCloseDialog();
        cy.wait(Cypress.config('regularWaitMs'));
        cy.log('**** 5.1 Verify Reserved Courses');
        cy.getBySel('reservation-message').should('exist').and('be.visible')
            .and('have.text', 'Total Credits Reserved: 6 / 12');
        cy.getBySel('course-reserved').should('have.length', reservedCourses.length).each(($el, index) => {
            cy.wrap($el).should('contain.text', reservedCourses[index]);
        });
    });

    // TC-PBI10-7
    // (CHANGE- RESERVED- COURSES)
    // error
    //  • Handles COURSE_NOT_OFFERRED_IN_PERIOD

    // (NO MANUAL TESTING)
    // 1. Set FE/BE clock to 2025-11-28T13:00:00Z
    // 2. Open ITB-ECoRS reserve.html page. Sign-in as 67130500140 (Somchai Jaidee)
    // 3. Click 'Remove' button on INT241
    // 4. Mock BE response: 409 COURSE_NOT_OFFERRED_IN_PERIOD
    // 5. Click 'Remove'
    // 6. Click 'OK'"	"1. [step 2]
    //      1.1 Declaration Status: Not Declared
    //      1.2 No Core Courses shown
    //      1.3 Reserved Courses:
    //                INT241 Data Structures and Algorithms (3 credits)
    //                INT242 Java Programming (3 credits)
    //                INT270 Mathematics for Artificial Intelligence (3 credits)
    //                Total Credits Reserved: 9 / 12
    //      1.4 No highlight
    // 2. [step 5]
    //     2.1 BE response with 409
    //    {
    //      ""error"": ""COURSE_NOT_OFFERRED_IN_PERIOD"",
    //      ""message"": ""This course offering is not in the same semester as the current reservation period.""
    //    }
    //     2.2 FE show dialog ""This course offering is not in the same semester as the current reservation period.""
    // 3. [step 6] FE reload reserve.html page. Display as in step 2.

});
