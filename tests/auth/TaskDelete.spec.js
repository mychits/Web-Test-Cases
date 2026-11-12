
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Two Created Tasks', async ({ page }) => {

  test.setTimeout(90000);

  // Open website
  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/');
  await page.waitForTimeout(2000);

  // Open Dashboard
  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/dashboard');
  await page.waitForTimeout(2000);

  // Open Task page
  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/task');
  await page.waitForTimeout(3000);

  console.log('Task page opened');

  const searchBox = page.getByPlaceholder('Search by agent name, task title...');

  const deleteTask = async (assignedPerson, phoneNumber) => {

    const searchValue = `${assignedPerson} (${phoneNumber})`;

    console.log(`Searching: ${searchValue}`);

    // Search assigned person and phone number
    await searchBox.fill(searchValue);
    await page.waitForTimeout(2000);

    // Find matching task row
    const row = page.getByRole('row').filter({
      hasText: assignedPerson
    }).filter({
      hasText: phoneNumber
    });

    await expect(row).toBeVisible({ timeout: 15000 });

    // Click three dots in Action column
    await row.locator('td').last().locator('svg').last().click();
    await page.waitForTimeout(1000);

    // Click Delete
    await page.getByText('Delete', { exact: true }).last().click();
    await page.waitForTimeout(1000);

    // Confirm deletion if confirmation button appears
    const confirmButton = page.getByRole('button', {
      name: /^delete$/i
    }).last();

    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await page.waitForTimeout(2000);

    console.log(`Deleted task assigned to: ${assignedPerson}`);
    
    // Clear search before next task
    await searchBox.fill('');
    await page.waitForTimeout(1500);
  };

  // Delete first task
  console.log('Starting Task 1 deletion');
  await deleteTask('test-Yokesh m', '9019706987');
  console.log('Task 1 deletion completed');

  // Delete second task
  console.log('Starting Task 2 deletion');
  await deleteTask('test-Basavaraju k', '9731805149');
  console.log('Task 2 deletion completed');

});
