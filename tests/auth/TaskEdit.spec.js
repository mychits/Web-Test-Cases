
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Task - Bglr-karthi', async ({ page }) => {

  test.setTimeout(120000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const customerName = 'Bglr-karthi';

  // Open website
  await page.goto(baseURL);
  await page.waitForTimeout(2000);

  // Open Dashboard
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForTimeout(2000);

  // Open Task page
  await page.goto(`${baseURL}/task`);
  await page.waitForTimeout(3000);

  console.log('Task page opened successfully.');

  // Search task
  const searchBox = page.getByPlaceholder(
    'Search by agent name, task title...'
  );

  await searchBox.fill(customerName);
  await page.waitForTimeout(2000);

  console.log(`Searching task: ${customerName}`);

  // Find task row
  const taskRow = page.getByRole('row').filter({
    hasText: customerName
  }).first();

  await expect(taskRow).toBeVisible({ timeout: 15000 });

  console.log(`Task found: ${customerName}`);

  // Click three-dot action menu
  const actionCell = taskRow.locator('td').last();
  await actionCell.locator('svg').last().click();

  await page.waitForTimeout(1000);

  console.log('Action menu opened.');

  // Click Edit
  await page.getByText('Edit', { exact: true }).last().click();

  await page.waitForTimeout(2000);

  console.log('Edit Task form opened.');

  // Change Customer to Employee
  const customerDropdown = page.getByText('Customer', {
    exact: true
  }).last();

  await expect(customerDropdown).toBeVisible({ timeout: 10000 });
  await customerDropdown.click();

  await page.waitForTimeout(1000);

  const employeeOption = page.getByText('Employee', {
    exact: true
  }).last();

  await expect(employeeOption).toBeVisible({ timeout: 10000 });
  await employeeOption.click();

  await page.waitForTimeout(1500);

  console.log('Assignee Type changed to Employee.');

  // Find the Select Employee Ant Design dropdown
  const employeePlaceholder = page.locator(
    '.ant-select-selection-placeholder'
  ).filter({
    hasText: 'Select Employee'
  }).last();

  await expect(employeePlaceholder).toBeVisible({
    timeout: 10000
  });

  // Click the parent dropdown instead of the placeholder text
  const employeeDropdown = employeePlaceholder.locator(
    'xpath=ancestor::div[contains(@class,"ant-select-selector")]'
  );

  await employeeDropdown.click();

  await page.waitForTimeout(1500);

  console.log('Employee dropdown opened.');

  // Select any available employee randomly
  const employeeOptions = page.locator(
    '.ant-select-item-option:visible'
  );

  await expect(employeeOptions.first()).toBeVisible({
    timeout: 10000
  });

  const optionCount = await employeeOptions.count();

  const randomIndex = Math.floor(Math.random() * optionCount);

  const selectedEmployee = (
    await employeeOptions.nth(randomIndex).innerText()
  ).trim();

  await employeeOptions.nth(randomIndex).click();

  await page.waitForTimeout(1500);

  console.log(`Employee selected: ${selectedEmployee}`);

  // Click Continue at the bottom
  const continueButton = page.getByRole('button', {
    name: 'Continue',
    exact: true
  });

  await expect(continueButton).toBeVisible({
    timeout: 10000
  });

  await continueButton.scrollIntoViewIfNeeded();
  await continueButton.click();

  await page.waitForTimeout(2000);

  console.log('Continue button clicked.');

  console.log('====================================');
  console.log('TASK EDIT PROCESS COMPLETED');
  console.log(`Task: ${customerName}`);
  console.log('Assignee Type: Employee');
  console.log(`Selected Employee: ${selectedEmployee}`);
  console.log('Action: Continue');
  console.log('====================================');

});
