
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete Three Employees and Verify Each Deletion', async ({ page }) => {
  test.setTimeout(240000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const dashboardURL = `${baseURL}dashboard`;

  const employeeURL =
    `${baseURL}staff-menu/employee-menu/employee`;

  const employees = [
    'Jack Kiran',
    'Jack Praveen',
    'Jack Rohan'
  ];

  let deletedCount = 0;
  let alreadyDeletedCount = 0;

  // STEP 1: Open Dashboard
  await page.goto(dashboardURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Dashboard opened:', page.url());

  // STEP 2: Open Employee Page
  await page.goto(employeeURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  await page.waitForTimeout(2000);

  console.log('Employee page opened:', page.url());

  // STEP 3: Find Employee Across All Table Pages
  async function findEmployeeAcrossPages(employeeName) {
    const rows = page.locator('table tbody tr');

    for (let pageNumber = 1; pageNumber <= 30; pageNumber++) {
      await page.waitForTimeout(500);

      const matchingRow = rows.filter({
        hasText: employeeName
      });

      const rowCount = await matchingRow.count();

      if (rowCount > 0) {
        console.log(
          `Employee found: ${employeeName} on table page ${pageNumber}`
        );

        return matchingRow.first();
      }

      const nextPage = page.locator('.ant-pagination-next').last();

      if (await nextPage.count() === 0) {
        break;
      }

      const disabled =
        await nextPage.getAttribute('aria-disabled') === 'true';

      const className =
        await nextPage.getAttribute('class') || '';

      if (
        disabled ||
        className.includes('ant-pagination-disabled')
      ) {
        break;
      }

      await nextPage.click();

      await page.waitForTimeout(1000);
    }

    // Print actual table rows to diagnose missing employee
    const actualRows = await rows.allTextContents();

    console.log('Current table rows:', actualRows);

    console.log(
      `Employee not found across table pages: ${employeeName}`
    );

    return null;
  }

  // STEP 4: Open Action Menu
  async function openActionMenu(row, employeeName) {
    const actionCell = row.locator('td').last();

    const threeDots = actionCell.locator('svg').last();

    await expect(threeDots).toBeVisible({
      timeout: 10000
    });

    await threeDots.click();

    console.log(`Action menu opened: ${employeeName}`);

    // Select Delete
    const deleteOption = page.getByText('Delete', {
      exact: true
    }).last();

    await expect(deleteOption).toBeVisible({
      timeout: 10000
    });

    await deleteOption.click();

    console.log(`Delete option clicked: ${employeeName}`);
  }

  // STEP 5: Confirm Employee Deletion
  async function confirmDelete(employeeName) {
    const confirmation = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    await expect(confirmation).toBeVisible({
      timeout: 15000
    });

    console.log(`Delete confirmation opened: ${employeeName}`);

    const nameInput = confirmation.locator('input').last();

    await expect(nameInput).toBeVisible({
      timeout: 10000
    });

    await nameInput.fill(employeeName);

    console.log(`Employee name entered: ${employeeName}`);

    const finalDeleteButton = confirmation.getByRole('button', {
      name: /again delete|delete/i
    }).last();

    await expect(finalDeleteButton).toBeVisible({
      timeout: 10000
    });

    await expect(finalDeleteButton).toBeEnabled({
      timeout: 10000
    });

    await finalDeleteButton.click();

    console.log(`Final Delete clicked: ${employeeName}`);

    await page.waitForTimeout(2000);
  }

  // STEP 6: Verify Employee Is Deleted
  async function verifyEmployeeDeleted(employeeName) {
    await page.goto(employeeURL, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(1500);

    const remainingRow = await findEmployeeAcrossPages(employeeName);

    if (remainingRow) {
      throw new Error(
        `Employee "${employeeName}" is still present after deletion.`
      );
    }

    console.log(`SUCCESS: ${employeeName} is absent from the table.`);
  }

  // STEP 7: Process Employees
  for (const employeeName of employees) {
    console.log('--------------------------------');
    console.log(`Processing employee: ${employeeName}`);

    await page.goto(employeeURL, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(1500);

    const employeeRow =
      await findEmployeeAcrossPages(employeeName);

    if (!employeeRow) {
      console.log(
        `NOT FOUND: ${employeeName}. No deletion attempted.`
      );

      alreadyDeletedCount++;

      continue;
    }

    // Click three dots and Delete
    await openActionMenu(employeeRow, employeeName);

    // Enter employee name and confirm
    await confirmDelete(employeeName);

    // Verify deletion
    await verifyEmployeeDeleted(employeeName);

    deletedCount++;

    console.log(`Deleted successfully: ${employeeName}`);

    console.log(
      `Deleted in this run: ${deletedCount}`
    );
  }

  // STEP 8: Final Result
  console.log('--------------------------------');

  console.log(`Deleted in this run: ${deletedCount}`);
  console.log(`Not found before deletion: ${alreadyDeletedCount}`);

  console.log(
    `FINAL RESULT: ${deletedCount + alreadyDeletedCount}/${employees.length} employees absent from the table.`
  );

  expect(deletedCount + alreadyDeletedCount).toBe(employees.length);
});
