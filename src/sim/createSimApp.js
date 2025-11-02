// src/sim/createSimApp.js
const express = require('express');
const simRouter = require('./simRouter');

function createSimApp() {
  const app = express();
  app.use('/sim', simRouter);
  return app;
}

module.exports = { createSimApp };