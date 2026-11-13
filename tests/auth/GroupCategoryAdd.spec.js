
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Two Group Categories', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  await page.goto(baseURL);
  await page.waitForTimeout(3000);

  await page.goto(baseURL + 'group-menu');
  await page.waitForTimeout(5000);

  if (await page.getByText('Admin Login', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please run LoginAutomation.spec.js first.');
  }

  // Click Group Category
  await page.getByText('Group Category', { exact: true }).click();
  await page.waitForTimeout(3000);

  const categories = [
    {
      name: 'Automation Group Category 1',
      description: 'This category is created for testing group category management through Playwright automation.'
    },
    {
      name: 'Automation Group Category 2',
      description: 'This category is created to verify that multiple group categories can be added successfully.'
    }
  ];

  for (const category of categories) {

    console.log(`Starting: ${category.name}`);

    // Click +Add Group Category
    await page.getByRole('button', {
      name: /add group category/i
    }).click();

    await page.waitForTimeout(2000);

    const modal = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    await expect(modal).toBeVisible();

    // Fill Category Name
    await modal.locator('input').first().fill(category.name);
    await page.waitForTimeout(1500);

    // Fill Description
    await modal.locator('textarea').first().fill(category.description);
    await page.waitForTimeout(1500);

    // Click Save Category
    await modal.getByRole('button', {
      name: /save category/i
    }).click();

    console.log(`Clicked Save Category for: ${category.name}`);

    await expect(modal).toBeHidden({ timeout: 30000 });

    await page.waitForTimeout(4000);

    console.log(`Successfully added: ${category.name}`);
  }

  console.log('Successfully completed adding two Group Categories.');

});
