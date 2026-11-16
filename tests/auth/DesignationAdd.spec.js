
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Designation and Logout', async ({ page }) => {

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

  await page.waitForTimeout(4000);

  console.log('Designation page opened');

  // Step 3: Click Add Designation
  const addDesignationButton = page.getByRole('button', {
    name: /Add Designation/i
  }).first();

  await expect(addDesignationButton).toBeVisible({
    timeout: 15000
  });

  await addDesignationButton.click();

  await page.waitForTimeout(2000);

  console.log('Add Designation form opened');

  // Step 4: Enter Designation Title
  const titleInput = page.getByRole('textbox').last();

  await expect(titleInput).toBeVisible({
    timeout: 15000
  });

  await titleInput.fill(designationTitle);

  await expect(titleInput).toHaveValue(designationTitle);

  await page.waitForTimeout(1000);

  console.log('Designation Title entered:', designationTitle);

  // Step 5: Handle browser confirmation popup
  page.on('dialog', async dialog => {
    console.log('Confirmation popup:', dialog.message());
    await dialog.accept();
    console.log('Confirmation popup accepted');
  });

  // Step 6: Locate Save Designation button
  const saveDesignationButton = page.getByRole('button', {
    name: /Save Designation/i
  }).last();

  await expect(saveDesignationButton).toBeVisible({
    timeout: 10000
  });

  await expect(saveDesignationButton).toBeEnabled();

  // Step 7: Wait for Designation API response
  const designationResponsePromise = page.waitForResponse(response => {
    const request = response.request();

    return (
      request.method().toUpperCase() === 'POST' &&
      response.url().includes('/api/designation/add-designation')
    );
  }, {
    timeout: 30000
  });

  // Step 8: Save Designation
  await saveDesignationButton.click();

  console.log('Save Designation button clicked');

  // Step 9: Capture API response
  let designationResponse;

  try {
    designationResponse = await designationResponsePromise;
  } catch (error) {
    throw new Error('Designation API response was not detected.');
  }

  console.log('Designation API URL:', designationResponse.url());
  console.log('Designation API Method:', designationResponse.request().method());
  console.log('Designation API Status:', designationResponse.status());

  const responseBody = await designationResponse.text();

  console.log('Designation API Response:', responseBody);

  // Step 10: Verify successful creation
  if (designationResponse.status() !== 201) {
    throw new Error(
      `Designation creation failed. Status: ${designationResponse.status()}. Response: ${responseBody}`
    );
  }

  let responseData;

  try {
    responseData = JSON.parse(responseBody);
  } catch (error) {
    throw new Error('Could not parse Designation API response.');
  }

  if (responseData.message !== 'Designation Created Successfully') {
    throw new Error(
      `Unexpected Designation API response: ${responseBody}`
    );
  }

  console.log('Designation created successfully');

  // Step 11: Verify designation title on page
  await expect(
    page.getByText(designationTitle, { exact: true })
  ).toBeVisible({
    timeout: 15000
  });

  console.log('Designation title verified on page');

  // Step 12: Find the top-right profile/menu button
  await page.waitForTimeout(1500);

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
    throw new Error(
      'Top-right profile menu button not found. Check the Visible buttons output.'
    );
  }

  const profileButtonIndex = profileCandidates[0].index;

  const profileButton = visibleButtons.nth(profileButtonIndex);

  await expect(profileButton).toBeVisible();

  await profileButton.click();

  await page.waitForTimeout(1500);

  console.log('Profile menu opened');

  // Step 13: Click Logout
  const logoutButton = page.getByText('Logout', {
    exact: true
  }).last();

  await expect(logoutButton).toBeVisible({
    timeout: 10000
  });

  await logoutButton.click();

  console.log('Logout button clicked');

  // Step 14: Verify logout
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

  // Step 15: Test completed
  console.log('Designation added successfully:', designationTitle);
  console.log('Test case completed successfully');

});
