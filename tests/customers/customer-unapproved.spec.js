
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Un Approve Customers - Dev.praveen and Dev.vignesh', async ({ page }) => {

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

  if (/unexpected error|page not found|cannot get \/dashboard/i.test(dashboardContent)) {
    throw new Error('Dashboard page is displaying an error.');
  }

  if (await page.getByText('Admin Login', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please update auth-state.json.');
  }

  console.log('Login successful');

  // Step 2: Open Customer Menu
  await page.goto(`${baseURL}/customer-menu`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(5000);

  const customerContent = await page.locator('body').innerText();

  if (/unexpected error|page not found|cannot get \/customer-menu/i.test(customerContent)) {
    throw new Error('Customer Menu page is displaying an error.');
  }

  console.log('Customer Menu opened');

  // Step 3: Find Customers heading
  const customersHeading = page.getByText('Customers', {
    exact: true
  }).first();

  await expect(customersHeading).toBeVisible({ timeout: 15000 });

  console.log('Customers section found');

  // Step 4: Find editable search input below Customers
  const allInputs = page.locator('input:visible');

  const inputCount = await allInputs.count();

  let searchInput = null;

  for (let i = 0; i < inputCount; i++) {
    const currentInput = allInputs.nth(i);

    const isReadonly = await currentInput.getAttribute('readonly');
    const isDisabled = await currentInput.isDisabled().catch(() => true);
    const inputType = await currentInput.getAttribute('type');

    if (!isReadonly && !isDisabled && inputType !== 'hidden') {
      const box = await currentInput.boundingBox();
      const headingBox = await customersHeading.boundingBox();

      if (
        box &&
        headingBox &&
        box.y >= headingBox.y &&
        box.y - headingBox.y < 300
      ) {
        searchInput = currentInput;
        break;
      }
    }
  }

  if (!searchInput) {
    throw new Error('Editable Customers search input not found. Check the Customers section HTML.');
  }

  await expect(searchInput).toBeVisible();

  console.log('Customers search input found');

  // Step 5: Process customers
  const customerNames = ['Dev.praveen', 'Dev.vignesh'];

  for (const customerName of customerNames) {

    console.log(`Searching customer: ${customerName}`);

    await searchInput.fill(customerName);

    await page.waitForTimeout(3000);

    // Find customer row
    const customerRow = page.locator('table tbody tr')
      .filter({ hasText: customerName })
      .first();

    await expect(customerRow).toBeVisible({ timeout: 15000 });

    console.log(`${customerName} found`);

    // Step 6: Click three-dot menu
    const actionCell = customerRow.locator('td').last();

    const actionButton = actionCell.locator('button, [role="button"]');

    if (await actionButton.count() > 0) {
      await actionButton.last().click();
    } else {
      await actionCell.locator('svg').last().click();
    }

    await page.waitForTimeout(1500);

    // Step 7: Click Un Approve Customer
    const unApproveOption = page.getByText(/^Un Approve Customer$/i).last();

    await expect(unApproveOption).toBeVisible({ timeout: 10000 });

    await unApproveOption.click();

    await page.waitForTimeout(1500);

    // Step 8: Confirm Yes
    const yesButton = page.getByRole('button', {
      name: /^Yes$/i
    }).last();

    await expect(yesButton).toBeVisible({ timeout: 10000 });

    await yesButton.click();

    await page.waitForTimeout(4000);

    console.log(`${customerName} unapproved successfully`);

  }

  console.log('Both customers unapproved successfully');

});
