const { defineConfig } = require("cypress");

// set your team code here
const team_code = "kk2";

module.exports = defineConfig({
  e2e: {
    team_code,
    // do not change baseUrl
    // baseUrl: "http://localhost:5173/intproj25/kk2/itb-ecors",
    baseUrl: `http://bscit.sit.kmutt.ac.th/intproj25/${team_code}/itb-ecors`, 
    // baseUrl: "http://localhost:5173",
    // do not change Keycloak URL
    keycloakUrl: "https://bscit.sit.kmutt.ac.th/intproj25/ft/keycloak/realms/itb-ecors",
    // wait time while redirecting to Keycloak for authentication
    keycloakWaitMs: 300,
    // wait time for each reserve.html page loading
    regularWaitMs: 500,
    // wait time for dialog appearance
    dialogWaitMs: 300,
    specPattern: "cypress/e2e/**/*.cy.js",
    experimentalRunAllSpecs: true,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});