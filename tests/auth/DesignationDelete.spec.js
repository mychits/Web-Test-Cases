
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Designation - MyChits QA Tester 16112026', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL = (
    process.env.BASE_URL ||
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com'
  ).replace(/\/+$/, '');

  const designationTitle = 'MyChits QA Tester 16112026';

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

  // Step 2: Open Designation page
  await page.goto(`${baseURL}/designation`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(5000);

  console.log('Designation page opened');

  // Step 3: Find the Designation row
  const designationRow = page.locator('table tbody tr')
    .filter({ hasText: designationTitle })
    .first();

  await expect(designationRow).toBeVisible({
    timeout: 20000
  });

  console.log('Designation found:', designationTitle);

  // Step 4: Open three-dot Action menu
  const actionCell = designationRow.locator('td').last();

  const actionButtons = actionCell.locator('button, [role="button"]');

  if (await actionButtons.count() > 0) {
    await actionButtons.last().click();
  } else {
    await actionCell.locator('svg').last().click();
  }

  await page.waitForTimeout(1500);

  console.log('Action menu opened');

  // Step 5: Click Delete from Action menu
  const deleteOption = page.getByText(/^Delete$/i).last();

  await expect(deleteOption).toBeVisible({
    timeout: 10000
  });

  await deleteOption.click();

  await page.waitForTimeout(2000);

  console.log('Delete confirmation opened');

  // Step 6: Enter exact Designation name for confirmation
  const confirmationInput = page.locator('input:visible').last();

  await expect(confirmationInput).toBeVisible({
    timeout: 10000
  });

  await confirmationInput.fill(designationTitle);

  await expect(confirmationInput).toHaveValue(designationTitle);

  console.log('Exact Designation name entered:', designationTitle);

  // Step 7: Locate final Delete button
  const confirmDeleteButton = page.getByRole('button', {
    name: 'Delete',
    exact: true
  }).last();

  await expect(confirmDeleteButton).toBeVisible({
    timeout: 10000
  });

  await expect(confirmDeleteButton).toBeEnabled();

  // Step 8: Wait for Designation deletion API response
  const deletionResponsePromise = page.waitForResponse(response => {
    const request = response.request();

    return (
      ['DELETE', 'PUT', 'POST', 'PATCH'].includes(
        request.method().toUpperCase()
      ) &&
      ['xhr', 'fetch'].includes(request.resourceType()) &&
      /designation/i.test(response.url()) &&
      !/add-designation/i.test(response.url())
    );
  }, {
    timeout: 30000
  });

  // Step 9: Click final Delete button
  await confirmDeleteButton.click();

  console.log('Final Delete button clicked');

  // Step 10: Capture deletion API response
  let deletionResponse;

  try {
    deletionResponse = await deletionResponsePromise;
  } catch (error) {
    throw new Error(
      'Designation deletion API response was not detected. Please check the browser Network request.'
    );
  }

  console.log('Deletion API URL:', deletionResponse.url());
  console.log('Deletion API Method:', deletionResponse.request().method());
  console.log('Deletion API Status:', deletionResponse.status());

  // Step 11: Read API response
  let responseBody = '';

  try {
    responseBody = await deletionResponse.text();
    console.log('Deletion API Response:', responseBody);
  } catch (error) {
    console.log('Could not read deletion API response body.');
  }

  // Step 12: Verify API status
  if (!deletionResponse.ok()) {
    throw new Error(
      `Designation deletion failed. Status: ${deletionResponse.status()}. Response: ${responseBody}`
    );
  }

  console.log('Designation deletion API returned successful status');

  // Step 13: Verify deletion response message
  if (responseBody) {
    let responseData;

    try {
      responseData = JSON.parse(responseBody);
    } catch (error) {
      responseData = null;
    }

    if (
      responseData &&
      responseData.message &&
      !/success|deleted|removed/i.test(responseData.message)
    ) {
      throw new Error(`Unexpected deletion response: ${responseBody}`);
    }
  }

  // Step 14: Verify designation is removed
  await expect(
    page.locator('table tbody tr').filter({ hasText: designationTitle })
  ).toHaveCount(0, {
    timeout: 15000
  });

  console.log('Designation removed from the table');

  // Step 15: Find top-right profile menu button
  const visibleButtons = page.locator('button:visible');

  const buttonDetails = await visibleButtons.evaluateAll(buttons => {
    return buttons.map((button, index) => {
      const rect = button.getBoundingClientRect();

      return {
        index,
        text: button.innerText,
        ariaLabel: button.getAttribute('aria-label'),
        title: button.getAttribute('title'),
        hasSvg: !!button.querySelector('svg'),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    });
  });

  console.log('Visible buttons:', buttonDetails);

  const viewport = page.viewportSize();

  const profileCandidates = buttonDetails
    .filter(button =>
      button.hasSvg &&
      button.y >= 0 &&
      button.y < 160 &&
      button.x > viewport.width * 0.55 &&
      button.width > 0 &&
      button.height > 0
    )
    .sort((a, b) => b.x - a.x);

  if (profileCandidates.length === 0) {
    throw new Error('Top-right profile menu button not found.');
  }

  const profileButton = visibleButtons.nth(
    profileCandidates[0].index
  );

  await profileButton.click();

  await page.waitForTimeout(1500);

  console.log('Profile menu opened');

  // Step 16: Click Logout
  const logoutButton = page.getByText('Logout', {
    exact: true
  }).last();

  await expect(logoutButton).toBeVisible({
    timeout: 10000
  });

  await logoutButton.click();

  console.log('Logout button clicked');

  // Step 17: Verify logout
  await expect.poll(
    async () => {
      const bodyText = await page.locator('body')
        .innerText()
        .catch(() => '');

      const currentPath = new URL(page.url()).pathname;

      return (
        /Admin Login/i.test(bodyText) ||
        currentPath === '/'
      );
    },
    {
      timeout: 20000,
      message: 'Logout was not completed successfully'
    }
  ).toBe(true);

  console.log('Logout successful');

  // Step 18: Test completed
  console.log('Designation deleted successfully:', designationTitle);
  console.log('Test case completed successfully');

});
