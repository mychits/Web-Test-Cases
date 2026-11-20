
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
    storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Penalty Amount for Mayil Sami', async ({ page }) => {

    test.setTimeout(120000);

    const baseUrl = process.env.BASE_URL.replace(/\/+$/, '');
    const customerName = 'Mayil Sami';

    // Open Penalty Management
    await page.goto(`${baseUrl}/penalty-management`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    await page.waitForTimeout(3000);

    console.log('Opened Penalty Management');

    // Check login session
    if (
        await page.getByText('Admin Login', { exact: true })
            .isVisible()
            .catch(() => false)
    ) {
        throw new Error('Login session expired. Generate a fresh auth-state.json.');
    }

    // Wait for table
    const table = page.locator('table').first();

    await expect(table).toBeVisible({
        timeout: 20000
    });

    // Find the exact CUSTOMER column
    const headers = table.locator('thead th');
    const headerCount = await headers.count();

    let customerColumnIndex = -1;

    for (let i = 0; i < headerCount; i++) {

        const heading = (await headers.nth(i).innerText()).trim();

        if (heading.toUpperCase() === 'CUSTOMER') {
            customerColumnIndex = i;
            break;
        }
    }

    expect(
        customerColumnIndex,
        'CUSTOMER column was not found'
    ).toBeGreaterThanOrEqual(0);

    console.log('CUSTOMER column found.');

    // Find Mayil Sami
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    let customerRow = null;

    for (let i = 0; i < rowCount; i++) {

        const row = rows.nth(i);
        const cells = row.locator('td');

        if (await cells.count() <= customerColumnIndex) {
            continue;
        }

        const name = (await cells
            .nth(customerColumnIndex)
            .innerText()).trim();

        if (name === customerName) {
            customerRow = row;
            break;
        }
    }

    expect(
        customerRow,
        `Customer ${customerName} was not found on the current page`
    ).not.toBeNull();

    console.log(`Customer found: ${customerName}`);

    // Open three-dot action menu
    const actionCell = customerRow.locator('td').last();

    const actionButtons = actionCell.locator(
        'button, [role="button"]'
    );

    if (await actionButtons.count() > 0) {
        await actionButtons.last().click();
    } else {
        await actionCell.locator('svg').last().click();
    }

    await page.waitForTimeout(700);

    console.log('Action menu opened.');

    // Click Edit Penalty
    const editPenaltyOption = page.getByText('Edit Penalty', {
        exact: true
    }).last();

    await expect(editPenaltyOption).toBeVisible({
        timeout: 10000
    });

    await editPenaltyOption.click();

    await page.waitForTimeout(2000);

    console.log('Edit Penalty page opened.');

    // Find the input containing the current penalty amount 100
    const visibleInputs = page.locator('input:visible');

    const inputCount = await visibleInputs.count();

    let penaltyAmountInput = null;
    let matchingAmountCount = 0;

    for (let i = 0; i < inputCount; i++) {

        const input = visibleInputs.nth(i);
        const value = (await input.inputValue()).trim();

        if (value === '100') {
            penaltyAmountInput = input;
            matchingAmountCount++;
        }
    }

    expect(
        matchingAmountCount,
        'Could not uniquely identify the penalty amount input containing 100'
    ).toBe(1);

    // Change penalty amount from 100 to 1000
    await penaltyAmountInput.fill('1000');

    await page.waitForTimeout(1000);

    console.log('Penalty amount changed from 100 to 1000.');

    // Click Update Penalty at the bottom
    const updatePenalty = page.getByText('Update Penalty', {
        exact: true
    }).last();

    await expect(updatePenalty).toBeVisible({
        timeout: 10000
    });

    await updatePenalty.scrollIntoViewIfNeeded();
    await updatePenalty.click();

    await page.waitForTimeout(2000);

    console.log('Update Penalty clicked successfully.');

    // Report
    console.log('====================================');
    console.log('       PENALTY EDIT REPORT');
    console.log('====================================');
    console.log(`Customer: ${customerName}`);
    console.log('Previous Penalty Amount: 100');
    console.log('Updated Penalty Amount: 1000');
    console.log('Status: Update Penalty clicked');
    console.log('====================================');

});
