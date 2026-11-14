
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Bid Request', async ({ page, context }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com';

  // Customer details
  const customerName = 'Blr-kholi';
  const mobileNumber = '9633232158';

  // Step 1: Open Dashboard
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('Dashboard opened successfully');

  // Step 2: Verify login session
  if (await page.getByText('Admin Login').isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please update auth-state.json');
  }

  // Step 3: Open Bid Request page
  await page.goto(`${baseURL}/bid-request`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('Bid Request page opened successfully');

  // Step 4: Click + Bid Request
  const addBidRequestButton = page.getByRole('button', {
    name: /Bid Request/i
  }).last();

  await expect(addBidRequestButton).toBeVisible();
  await addBidRequestButton.click();

  await page.waitForTimeout(2000);

  // Step 5: Handle Create Bid Request page
  let newPage = page;

  if (context.pages().length > 1) {
    newPage = context.pages()[context.pages().length - 1];
  }

  await newPage.waitForLoadState('domcontentloaded');
  await newPage.waitForTimeout(3000);

  await expect(newPage).toHaveURL(`${baseURL}/bid-request/create`);

  console.log('Create Bid Request page opened successfully');

  // Step 6: Search customer
  const customerSearch = newPage.locator('#subscriberId');

  await expect(customerSearch).toBeVisible();
  await customerSearch.click();
  await newPage.waitForTimeout(1000);

  console.log('Customer dropdown opened');

  await customerSearch.fill(customerName);
  await newPage.waitForTimeout(2000);

  console.log(`Searching customer: ${customerName}`);

  // Step 7: Select matching customer
  const customerOption = newPage.getByText(
    `${customerName} - ${mobileNumber}`,
    { exact: true }
  );

  await expect(customerOption).toBeVisible();
  await customerOption.click();

  await newPage.waitForTimeout(3000);

  console.log('Customer selected successfully');

  // Step 8: Verify selected customer
  const subscriberName = newPage
    .getByText('Subscriber Name', { exact: true })
    .locator('xpath=following::input[1]');

  await expect(subscriberName).toHaveValue(customerName);

  const subscriberMobile = newPage
    .getByText('Mobile Number', { exact: true })
    .locator('xpath=following::input[1]');

  await expect(subscriberMobile).toHaveValue(mobileNumber);

  console.log('Customer name and mobile number verified');
  console.log('Remaining customer details auto-populated');

  // Step 9: Wait for auto-populated details
  await newPage.waitForTimeout(3000);

  // Step 10: Click Submit Request
  const submitButton = newPage.getByRole('button', {
    name: /SUBMIT REQUEST/i
  });

  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();

  await submitButton.click();

  console.log('Submit Request button clicked');

  await newPage.waitForTimeout(3000);

  // Step 11: Keep browser open for manual verification
  await newPage.pause();

});
