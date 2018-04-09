module.exports = {
  extends: "standard",
  root: true,
  rules: {
    camelcase: 0
  },

  plugins: ["cypress"],
  env: {
    "cypress/globals": true
  }
};
