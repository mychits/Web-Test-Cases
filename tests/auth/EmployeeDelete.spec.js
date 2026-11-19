
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

const employees = require('../../test-data/employee');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete All 100 Employees and Verify Each Deletion', async ({ page }) => {

  test.setTimeout(1200000); // 20 minutes

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
  const employeeURL = `${baseURL}/staff-menu/employee-menu/employee`;

  let deletedCount = 0;
  const failedEmployees = [];

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

  console.log('Dashboard opened:', `${baseURL}/dashboard`);

  // Step 2: Open Employee page
  await page.goto(employeeURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(3000);

  console.log('Employee page opened:', employeeURL);
  console.log(`Total employees to delete: ${employees.length}`);

  // Step 3: Find employee across table pages
  async function findEmployeeAcrossPages(employeeName) {

    const searchInput = page.getByPlaceholder('Search...', {
      exact: true
    }).first();

    await expect(searchInput).toBeVisible({
      timeout: 15000
    });

    await searchInput.fill(employeeName);

    await page.waitForTimeout(1000);

    for (let pageNumber = 1; pageNumber <= 30; pageNumber++) {

      const employeeRow = page.locator('table tbody tr')
        .filter({ hasText: employeeName })
        .first();

      if (await employeeRow.isVisible().catch(() => false)) {
        console.log(`Employee found: ${employeeName} on table page ${pageNumber}`);
        return employeeRow;
      }

      console.log(`Employee not found on table page ${pageNumber}`);

      const nextButton = page.locator(
        '.ant-pagination-next'
      ).last();

      if (await nextButton.count() === 0) {
        break;
      }

      const isDisabled = await nextButton.evaluate(element =>
        element.classList.contains('ant-pagination-disabled') ||
        element.getAttribute('aria-disabled') === 'true'
      ).catch(() => true);

      if (isDisabled) {
        break;
      }

      await nextButton.click();

      await page.waitForTimeout(1000);
    }

    console.log(
      'Employee table rows:',
      await page.locator('table tbody tr').allInnerTexts()
    );

    return null;
  }

  // Step 4: Open three-dot menu and click Delete
  async function openActionMenu(employeeRow, employeeName) {

    const actionCell = employeeRow.locator('td').last();

    const actionButtons = actionCell.locator(
      'button, [role="button"]'
    );

    if (await actionButtons.count() > 0) {
      await actionButtons.last().click();
    } else {
      await actionCell.locator('svg').last().click();
    }

    await page.waitForTimeout(1000);

    console.log(`Action menu opened: ${employeeName}`);

    const deleteOption = page.getByText('Delete', {
      exact: true
    }).last();

    await expect(deleteOption).toBeVisible({
      timeout: 10000
    });

    console.log(`Delete option found: ${employeeName}`);

    await deleteOption.click({
      force: true,
      timeout: 10000
    });

    console.log(`Delete option clicked: ${employeeName}`);
  }

  // Step 5: Enter exact employee name and confirm deletion
  async function confirmDelete(employeeName) {

    const confirmationDialog = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    await expect(confirmationDialog).toBeVisible({
      timeout: 15000
    });

    console.log(`Confirmation dialog opened: ${employeeName}`);

    const confirmationInput = confirmationDialog.locator('input').last();

    await expect(confirmationInput).toBeVisible({
      timeout: 10000
    });

    await confirmationInput.fill(employeeName);

    console.log(`Exact employee name entered: ${employeeName}`);

    await expect(confirmationInput).toHaveValue(employeeName);

    const finalDeleteButton = confirmationDialog.getByRole('button', {
      name: 'Delete',
      exact: true
    }).last();

    await expect(finalDeleteButton).toBeVisible({
      timeout: 10000
    });

    await expect(finalDeleteButton).toBeEnabled();

    await finalDeleteButton.click({
      force: true,
      timeout: 10000
    });

    console.log(`Final Delete clicked: ${employeeName}`);

    await expect(confirmationDialog).toBeHidden({
      timeout: 15000
    });

    console.log(`Confirmation dialog closed: ${employeeName}`);
  }

  // Step 6: Verify employee deletion
  async function verifyEmployeeDeleted(employeeName) {

    const searchInput = page.getByPlaceholder('Search...', {
      exact: true
    }).first();

    await expect(searchInput).toBeVisible({
      timeout: 10000
    });

    await searchInput.fill(employeeName);

    const remainingRow = page.locator('table tbody tr')
      .filter({ hasText: employeeName });

    try {

      await expect(remainingRow).toHaveCount(0, {
        timeout: 8000
      });

      console.log(`Verified employee deleted: ${employeeName}`);

      return true;

    } catch (error) {

      console.log(`Employee still appears. Reloading page: ${employeeName}`);
    }

    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    const refreshedSearchInput = page.getByPlaceholder('Search...', {
      exact: true
    }).first();

    await expect(refreshedSearchInput).toBeVisible({
      timeout: 15000
    });

    await refreshedSearchInput.fill(employeeName);

    const refreshedRow = page.locator('table tbody tr')
      .filter({ hasText: employeeName });

    try {

      await expect(refreshedRow).toHaveCount(0, {
        timeout: 10000
      });

      console.log(`Verified employee deleted after reload: ${employeeName}`);

      return true;

    } catch (error) {

      console.log(`Employee still exists after reload: ${employeeName}`);

      console.log(
        'Remaining matching rows:',
        await refreshedRow.allInnerTexts()
      );

      return false;
    }
  }

  // Step 7: Delete all employees
  for (let i = 0; i < employees.length; i++) {

    const employeeName = employees[i].name;

    console.log('--------------------------------');
    console.log(`Processing employee ${i + 1}/${employees.length}: ${employeeName}`);

    try {

      const employeeRow = await findEmployeeAcrossPages(employeeName);

      if (!employeeRow) {
        throw new Error(`Employee not found: ${employeeName}`);
      }

      await openActionMenu(employeeRow, employeeName);

      await confirmDelete(employeeName);

      const isDeleted = await verifyEmployeeDeleted(employeeName);

      if (!isDeleted) {
        throw new Error(`Employee deletion could not be verified: ${employeeName}`);
      }

      deletedCount++;

      console.log(`Successfully deleted and verified: ${employeeName}`);

    } catch (error) {

      console.log(`Failed to delete ${employeeName}: ${error.message}`);

      failedEmployees.push(employeeName);
    }
  }

  // Step 8: Final summary
  console.log('--------------------------------');
  console.log('EMPLOYEE DELETE SUMMARY');
  console.log('--------------------------------');

  console.log(`Total employees: ${employees.length}`);
  console.log(`Successfully deleted: ${deletedCount}`);
  console.log(`Failed employees: ${failedEmployees.length}`);

  if (failedEmployees.length > 0) {
    console.log('Failed employee names:', failedEmployees);
  }

  console.log('--------------------------------');

  expect(
    failedEmployees,
    'Some employees could not be deleted.'
  ).toHaveLength(0);

  console.log('All employees deleted successfully');
  console.log('All deletion verifications completed');
  console.log('Test case completed successfully');

});
