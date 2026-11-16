
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Remove Enrollment - World Cricket - Blr-trtrf', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL = (
    process.env.BASE_URL ||
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com'
  ).replace(/\/+$/, '');

  // Step 1: Open Dashboard
  await page.goto(`${baseURL}/dashboard`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(3000);

  const dashboardContent = await page.locator('body').innerText();

  if (/Admin Login/i.test(dashboardContent)) {
    throw new Error('Login session expired. Please update auth-state.json.');
  }

  console.log('Login successful');

  // Step 2: Open Enrollment page
  await page.goto(`${baseURL}/enroll-menu/enrollment`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(5000);

  await expect(
    page.getByText('Search or Select Group', { exact: true })
  ).toBeVisible({ timeout: 15000 });

  console.log('Enrollment page opened');

  // Step 3: Open Select Group dropdown
  const groupHeading = page.getByText('Search or Select Group', {
    exact: true
  });

  const headingBox = await groupHeading.boundingBox();

  if (!headingBox) {
    throw new Error('Select Group section not found.');
  }

  const dropdowns = page.locator(
    '.ant-select:visible, [role="combobox"]:visible'
  );

  let groupDropdown = null;

  for (let i = 0; i < await dropdowns.count(); i++) {
    const dropdown = dropdowns.nth(i);
    const box = await dropdown.boundingBox();

    if (
      box &&
      box.y >= headingBox.y &&
      box.y - headingBox.y < 200
    ) {
      groupDropdown = dropdown;
      break;
    }
  }

  if (!groupDropdown) {
    throw new Error('Select Group dropdown not found.');
  }

  await groupDropdown.click();

  await page.waitForTimeout(1500);

  console.log('Select Group dropdown opened');

  // Step 4: Select World Cricket
  const worldCricketOption = page.locator(
    '.ant-select-item-option'
  ).filter({
    hasText: /^World Cricket$/
  }).last();

  await expect(worldCricketOption).toBeVisible({
    timeout: 10000
  });

  await worldCricketOption.click();

  await page.waitForTimeout(5000);

  console.log('World Cricket group selected');

  // Step 5: Search for Blr-trtrf
  const searchInput = page.getByPlaceholder('Search...', {
    exact: true
  }).first();

  await expect(searchInput).toBeVisible({
    timeout: 15000
  });

  await searchInput.fill('Blr-trtrf');

  await page.waitForTimeout(3000);

  console.log('Searching for Blr-trtrf');

  // Step 6: Find customer row
  const customerRow = page.locator('table tbody tr')
    .filter({ hasText: 'Blr-trtrf' })
    .first();

  await expect(customerRow).toBeVisible({
    timeout: 15000
  });

  console.log('Customer Blr-trtrf found');

  // Step 7: Open three-dot Action menu
  const actionCell = customerRow.locator('td').last();

  const actionButtons = actionCell.locator(
    'button, [role="button"]'
  );

  if (await actionButtons.count() > 0) {
    await actionButtons.last().click();
  } else {
    await actionCell.locator('svg').last().click();
  }

  await page.waitForTimeout(1500);

  console.log('Action menu opened');

  // Step 8: Click Remove
  const removeOption = page.getByText(/^Remove$/i).last();

  await expect(removeOption).toBeVisible({
    timeout: 10000
  });

  await removeOption.click();

  await page.waitForTimeout(2000);

  console.log('Remove confirmation form opened');

  // Step 9: Verify Removal Reason confirmation window
  await expect(
    page.getByText('Please Select a Reason for Removal', {
      exact: true
    })
  ).toBeVisible({
    timeout: 10000
  });

  console.log('Removal Reason confirmation window opened');

  // Step 10: Locate Removal Reason dropdown
  const reasonDropdown = page.locator('select:visible').last();

  await expect(reasonDropdown).toBeVisible({
    timeout: 10000
  });

  // Step 11: Get available reasons
  const reasonOptions = await reasonDropdown.locator('option').allTextContents();

  console.log('Available removal reasons:', reasonOptions);

  if (reasonOptions.length < 2) {
    throw new Error('No selectable Removal Reason options found.');
  }

  // Select first available reason
  await reasonDropdown.selectOption({
    index: 1
  });

  await page.waitForTimeout(1000);

  console.log('Selected Removal Reason:', reasonOptions[1]);

  // Step 12: Locate final Remove button
  const confirmRemoveButton = page.getByRole('button', {
    name: 'Remove',
    exact: true
  }).last();

  await expect(confirmRemoveButton).toBeVisible({
    timeout: 10000
  });

  await expect(confirmRemoveButton).toBeEnabled();

  // Step 13: Wait for the actual removal API response
  const removalResponsePromise = page.waitForResponse(response => {
    const request = response.request();

    return (
      request.method().toUpperCase() === 'PUT' &&
      response.url().includes('/api/enroll/remove/')
    );
  }, {
    timeout: 30000
  });

  // Step 14: Click final Remove button
  await confirmRemoveButton.click();

  console.log('Final Remove button clicked');

  // Step 15: Capture removal API response
  let removalResponse;

  try {
    removalResponse = await removalResponsePromise;
  } catch (error) {
    throw new Error(
      'Enrollment removal API response was not detected.'
    );
  }

  console.log('Removal API URL:', removalResponse.url());
  console.log('Removal API Method:', removalResponse.request().method());
  console.log('Removal API Status:', removalResponse.status());

  // Step 16: Read API response body
  let responseBody = '';

  try {
    responseBody = await removalResponse.text();
    console.log('Removal API Response Body:', responseBody);
  } catch (error) {
    throw new Error('Could not read enrollment removal API response.');
  }

  // Step 17: Verify API status
  if (removalResponse.status() !== 200) {
    throw new Error(
      `Enrollment removal failed. Status: ${removalResponse.status()}. Response: ${responseBody}`
    );
  }

  // Step 18: Verify successful deletion message
  let responseData;

  try {
    responseData = JSON.parse(responseBody);
  } catch (error) {
    throw new Error(
      'Could not parse enrollment removal API response.'
    );
  }

  if (responseData.message !== 'Enrollment removed successfully') {
    throw new Error(
      `Unexpected removal response: ${responseBody}`
    );
  }

  console.log('Enrollment removed successfully');
  console.log('Removal API response verified');

  // Step 19: Test completed
  console.log('Test case completed successfully');

});
