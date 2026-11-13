
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test.setTimeout(60000);

test('Add Two New Tasks', async ({ page }) => {

  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/');
  await page.waitForTimeout(2000);

  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/dashboard');
  await page.waitForTimeout(2000);

  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/task');
  await page.waitForTimeout(2000);

  const selectOption = async (dialog, index, optionNumber) => {
    const dropdown = dialog.getByRole('combobox').nth(index);

    await dropdown.click();
    await page.waitForTimeout(500);

    // Select the first or second available option
    for (let i = 0; i < optionNumber; i++) {
      await page.keyboard.press('ArrowDown');
    }

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  };

  const selectEmployee = async (dialog, index, employeeName) => {
    const dropdown = dialog.getByRole('combobox').nth(index);

    await dropdown.click();
    await page.waitForTimeout(500);

    await page.keyboard.type(employeeName, { delay: 100 });
    await page.waitForTimeout(1000);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  };

  const addTask = async (description, dateTime, optionNumber) => {

    await page.getByRole('button', { name: /add task/i }).click();
    await page.waitForTimeout(1000);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Task Assigned To
    await selectOption(dialog, 0, optionNumber);

    // Assignee Type
    await selectEmployee(dialog, 1, 'Employee');

    await expect(dialog.getByRole('combobox')).toHaveCount(4);

    // Select Employee
    if (optionNumber === 0) {
      await selectEmployee(dialog, 2, 'Madhan');
    } else {
      await selectOption(dialog, 2, 1);
    }

    // Task Purpose
    await selectOption(dialog, 3, optionNumber);

    // Description and date
    await dialog.getByPlaceholder('Enter task description...').fill(description);
    await dialog.locator('input[type="datetime-local"]').fill(dateTime);

    await page.waitForTimeout(1000);

    await dialog.getByRole('button', { name: /continue/i }).click();
    await page.waitForTimeout(2000);

    console.log(`Task submitted: ${description}`);
  };

  console.log('Starting Task 1');
  await addTask('New Customer Visit', '2026-11-12T06:30', 0);
  console.log('Task 1 completed');

  await page.waitForTimeout(1500);

  console.log('Starting Task 2');
  await addTask('New Customer Support', '2026-11-12T07:00', 1);
  console.log('Task 2 completed');
});
