const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // baseUrl: "http://localhost:5173",
    // do not add trailing slash, make sure to use your <team_code>
    baseUrl: "http://bscit.sit.kmutt.ac.th/intproj25/kk2/itb-ecors", 
    // do not change Keycloak URL
    keycloakUrl: "https://bscit.sit.kmutt.ac.th/intproj25/ft/keycloak/realms/itb-ecors",
    // wait time while redirecting to Keycloak for authentication
    keycloakWaitMs: 1000,
    // wait time for each reserve.html page loading
    regularWaitMs: 1000,
    specPattern: "cypress/e2e/**/*.cy.js",
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});