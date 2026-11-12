
require('dotenv').config();

const { test } = require('@playwright/test');

const {
  validateConfig,
  login,
  openLoans,
  changeStatus
} = require('./loan-status-update');

test.setTimeout(180000);

test('Change Requested Loan to Pending', async ({ page }) => {
  page.setDefaultTimeout(15000);

  validateConfig();

  await login(page);

  await openLoans(page);

  await changeStatus(page, 'Requested', 'Pending');

  console.log('Pending test completed');
});
