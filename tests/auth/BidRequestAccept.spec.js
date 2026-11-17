
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Create and Accept Bid Request', async ({ page, context }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com';

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

  // Step 3: Open Bid Management
  await page.goto(`${baseURL}/bid-request`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('Bid Management page opened successfully');

  // Step 4: Click + Bid Request
  const addBidRequestButton = page.getByRole('button', {
    name: /Bid Request/i
  }).last();

  await expect(addBidRequestButton).toBeVisible();
  await addBidRequestButton.click();

  await page.waitForTimeout(2000);

  // Step 5: Handle Create Bid Request page
  let createPage = page;

  if (context.pages().length > 1) {
    createPage = context.pages()[context.pages().length - 1];
  }

  await createPage.waitForLoadState('domcontentloaded');
  await createPage.waitForTimeout(3000);

  await expect(createPage).toHaveURL(`${baseURL}/bid-request/create`);

  console.log('Create Bid Request page opened successfully');

  // Step 6: Search customer
  const customerSearch = createPage.locator('#subscriberId');

  await expect(customerSearch).toBeVisible();
  await customerSearch.click();
  await createPage.waitForTimeout(1000);

  await customerSearch.fill(customerName);
  await createPage.waitForTimeout(2000);

  console.log(`Searching customer: ${customerName}`);

  // Step 7: Select customer
  const customerOption = createPage.getByText(
    `${customerName} - ${mobileNumber}`,
    { exact: true }
  );

  await expect(customerOption).toBeVisible();
  await customerOption.click();

  await createPage.waitForTimeout(3000);

  console.log('Customer selected successfully');

  // Step 8: Verify customer details
  const subscriberName = createPage
    .getByText('Subscriber Name', { exact: true })
    .locator('xpath=following::input[1]');

  await expect(subscriberName).toHaveValue(customerName);

  const subscriberMobile = createPage
    .getByText('Mobile Number', { exact: true })
    .locator('xpath=following::input[1]');

  await expect(subscriberMobile).toHaveValue(mobileNumber);

  console.log('Customer name and mobile number verified');

  // Step 9: Wait for auto-filled details
  await createPage.waitForTimeout(3000);

  // Step 10: Submit Bid Request
  const submitButton = createPage.getByRole('button', {
    name: /SUBMIT REQUEST/i
  });

  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();

  await submitButton.click();

  console.log('Submit Request button clicked');

  await createPage.waitForTimeout(3000);

  // Step 11: Open Bid Request Report
  const reportPage = await context.newPage();

  await reportPage.goto(
    `${baseURL}/reports/bid-request-report`
  );

  await reportPage.waitForLoadState('domcontentloaded');
  await reportPage.waitForTimeout(5000);

  console.log('Bid Request Report page opened successfully');

  // Step 12: Locate the newest matching customer request
  const customerRow = reportPage
    .getByRole('row')
    .filter({ hasText: customerName })
    .first();

  await expect(customerRow).toBeVisible({
    timeout: 15000
  });

  console.log('Newest customer request located');

  // Step 13: Verify Pending status
  await expect(
    customerRow.getByText('Pending', { exact: true })
  ).toBeVisible();

  console.log('Request status verified: Pending');

  // Step 14: Click three-dot Action menu
  const actionButton = customerRow
    .locator('td')
    .last()
    .locator('button, [role="button"]')
    .last();

  await expect(actionButton).toBeVisible();
  await actionButton.click();

  await reportPage.waitForTimeout(1000);

  console.log('Action menu opened');

  // Step 15: Click Edit
  const editButton = reportPage.getByText('Edit', {
    exact: true
  }).last();

  await expect(editButton).toBeVisible();
  await editButton.click();

  await reportPage.waitForTimeout(2000);

  console.log('Edit Bid Request popup opened');

  // Step 16: Select Accept
  const acceptButton = reportPage.getByText('Accept', {
    exact: true
  }).last();

  await expect(acceptButton).toBeVisible();
  await acceptButton.click();

  await reportPage.waitForTimeout(1000);

  console.log('Accept clicked');

  // Step 17: Approve Request Confirmation
  // After clicking Accept, the Approve Request popup appears.
  // Click YES directly. Do not click Save Changes.

  await expect(
    reportPage.getByText('Approve Request', {
      exact: false
    })
  ).toBeVisible({
    timeout: 15000
  });

  console.log('Approve Request confirmation popup opened');

  const yesButton = reportPage.getByRole('button', {
    name: 'Yes',
    exact: true
  }).last();

  await expect(yesButton).toBeVisible();
  await yesButton.click();

  console.log('Approve Request confirmed by clicking Yes');

  // Step 18: Wait for the update to finish
  await reportPage.waitForTimeout(5000);

  // Step 19: Refresh the SAME report page
  await reportPage.reload();
  await reportPage.waitForLoadState('domcontentloaded');
  await reportPage.waitForTimeout(5000);

  console.log('Same report page refreshed');

  // Step 20: Locate the newest matching customer request again
  const updatedCustomerRow = reportPage
    .getByRole('row')
    .filter({ hasText: customerName })
    .first();

  await expect(updatedCustomerRow).toBeVisible({
    timeout: 15000
  });

  console.log('Newest customer request located for verification');

  // Step 21: Verify Accept status
  const acceptedStatus = updatedCustomerRow.getByText('Accept', {
    exact: true
  });

  await expect(acceptedStatus).toBeVisible({
    timeout: 15000
  });

  console.log('================================');
  console.log('BID REQUEST ACCEPTED SUCCESSFULLY');
  console.log(`Customer: ${customerName}`);
  console.log(`Mobile: ${mobileNumber}`);
  console.log('Final Status: Accept');
  console.log('================================');

  // Step 22: Keep the same report page open
  await reportPage.pause();

});
