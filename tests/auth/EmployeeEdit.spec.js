
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Employee - 123456', async ({ page }) => {

  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const employeeName = '123456';
  const updatedName = 'Spider man';

  // Open Employee page
  await page.goto(
    `${baseURL}/staff-menu/employee-menu/employee`,
    {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }
  );

  await page.waitForTimeout(2000);

  // Check login session
  if (
    await page.getByText('Admin Login', { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    throw new Error('Login session expired. Generate a fresh auth-state.json.');
  }

  console.log('Employee page opened successfully.');

  // Find employee row
  const employeeRow = page.locator('tr').filter({
    has: page.getByText(employeeName, { exact: true })
  }).first();

  await expect(employeeRow).toBeVisible({
    timeout: 15000
  });

  console.log(`Employee found: ${employeeName}`);

  // Click three-dot menu in ACTION column
  const actionCell = employeeRow.locator('td').last();
  const actionIcon = actionCell.locator('svg').last();

  await actionIcon.click({ timeout: 15000 });

  await page.waitForTimeout(1000);

  console.log('Action menu opened.');

  // Click Edit
  const editOption = page.getByText('Edit', {
    exact: true
  }).last();

  await expect(editOption).toBeVisible({
    timeout: 10000
  });

  await editOption.click();

  await page.waitForTimeout(2000);

  console.log('Edit Employee form opened.');

  // Find Full Name field
  let nameInput = page.getByLabel('Full Name', {
    exact: true
  }).first();

  if (await nameInput.count() === 0) {

    nameInput = page.getByPlaceholder(
      /enter.*full name/i
    ).first();

  }

  if (await nameInput.count() === 0) {

    const nameLabel = page.getByText('Full Name', {
      exact: true
    }).last();

    await expect(nameLabel).toBeVisible({
      timeout: 10000
    });

    nameInput = nameLabel.locator(
      'xpath=following::input[1]'
    );

  }

  await expect(nameInput).toBeVisible({
    timeout: 15000
  });

  await nameInput.scrollIntoViewIfNeeded();

  console.log('Full Name field found.');

  // Change employee name
  await nameInput.fill(updatedName);

  await page.waitForTimeout(1000);

  console.log(`Employee name changed to: ${updatedName}`);

  // Find Update Employee button
  const updateButton = page.getByRole('button', {
    name: 'Update Employee',
    exact: true
  });

  await updateButton.scrollIntoViewIfNeeded();

  await expect(updateButton).toBeVisible({
    timeout: 10000
  });

  console.log('Update Employee button found.');

  // Click Update Employee
  await updateButton.click();

  console.log('Update Employee clicked.');

  await page.waitForTimeout(3000);

  console.log('====================================');
  console.log('EMPLOYEE EDIT COMPLETED');
  console.log(`Previous Name: ${employeeName}`);
  console.log(`Updated Name: ${updatedName}`);
  console.log('Field Updated: Full Name');
  console.log('Action: Update Employee');
  console.log('====================================');

  // No logout required.
  // Playwright automatically closes the browser.

});
