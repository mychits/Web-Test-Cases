
require('dotenv').config();

const { test } = require('@playwright/test');

const {
  validateConfig,
  login,
  openLoans,
  changeStatus
} = require('./loan-status-update');

test.setTimeout(180000);

test('Change Pending Loan to Reject', async ({ page }) => {
  page.setDefaultTimeout(15000);

  validateConfig();

  await login(page);

  await openLoans(page);

  console.log('Starting Pending -> Reject automation');

  await changeStatus(page, 'Pending', 'Reject');

  console.log('Reject test completed');
});
