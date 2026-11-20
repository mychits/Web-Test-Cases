
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Lead Profession - Blr-jacksparrow', async ({ page }) => {

  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const leadName = 'Blr-jacksparrow';

  // Open Leads page
  await page.goto(`${baseURL}/lead`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(4000);

  // Check login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error('Login session expired. Generate a fresh auth-state.json.');
  }

  console.log('Leads page opened.');

  // Wait for table
  const table = page.locator('table').first();

  await expect(table).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(2000);

  console.log('Leads table loaded.');

  // Search lead
  const searchBox = page.locator('input:visible').first();

  await expect(searchBox).toBeVisible({ timeout: 15000 });

  await searchBox.fill(leadName);
  await page.waitForTimeout(2000);

  console.log(`Searching lead: ${leadName}`);

  // Find lead row
  const leadRow = page.locator('tbody tr').filter({
    hasText: leadName
  }).first();

  await expect(leadRow).toBeVisible({ timeout: 15000 });

  console.log(`Lead found: ${leadName}`);

  // Open three-dot action menu
  const actionCell = leadRow.locator('td').last();

  await actionCell.locator('svg').last().click({
    timeout: 15000
  });

  await page.waitForTimeout(700);

  console.log('Action menu opened.');

  // Click Edit
  const editOption = page.getByText('Edit', {
    exact: true
  }).last();

  await expect(editOption).toBeVisible({ timeout: 10000 });

  await editOption.click();
  await page.waitForTimeout(2000);

  console.log('Edit Lead form opened.');

  // Locate current profession value
  const professionValue = page.getByText('Self Employed', {
    exact: true
  }).last();

  await expect(professionValue).toBeVisible({
    timeout: 10000
  });

  // Open profession dropdown
  await professionValue.click();

  await page.waitForTimeout(1000);

  console.log('Profession dropdown opened.');

  // Select Employed
  const employedOption = page.getByText('Employed', {
    exact: true
  }).last();

  await expect(employedOption).toBeVisible({
    timeout: 10000
  });

  await employedOption.click();

  await page.waitForTimeout(1000);

  console.log('Lead Work/Profession changed to Employed.');

  // Click Update
  const updateButton = page.getByRole('button', {
    name: 'Update',
    exact: true
  }).last();

  await expect(updateButton).toBeVisible({
    timeout: 10000
  });

  await updateButton.scrollIntoViewIfNeeded();
  await updateButton.click();

  await page.waitForTimeout(2000);

  console.log('Lead updated successfully.');

  console.log('======================================');
  console.log('          LEAD EDIT REPORT');
  console.log('======================================');
  console.log(`Lead Name: ${leadName}`);
  console.log('Previous Profession: Self Employed');
  console.log('Updated Profession: Employed');
  console.log('Status: Update button clicked');
  console.log('======================================');

});
