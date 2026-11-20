
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
    storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Loan Penalty Amount', async ({ page }) => {

    test.setTimeout(300000);

    const baseURL = process.env.BASE_URL.replace(/\/+$/, '');

    const phoneNumber = '9483426975';

    // Step 1: Open Dashboard
    await page.goto(`${baseURL}/dashboard`, {
        waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(3000);

    console.log('Dashboard opened successfully');

    // Step 2: Verify login session
    if (
        await page.getByText('Admin Login', { exact: true })
            .isVisible()
            .catch(() => false)
    ) {
        throw new Error('Login session expired. Please update auth-state.json');
    }

    // Step 3: Open Penalty Management
    await page.goto(`${baseURL}/penalty-management`, {
        waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(3000);

    console.log('Penalty Management page opened successfully');

    // Step 4: Click Loan Penalties tab
    const loanPenaltyTab = page.getByText('Loan Penalties', {
        exact: true
    }).first();

    await expect(loanPenaltyTab).toBeVisible({
        timeout: 15000
    });

    await loanPenaltyTab.click();

    await page.waitForTimeout(2000);

    console.log('Loan Penalties tab opened successfully');

    // Step 5: Search using phone number
    const searchInput = page.locator(
        'input[placeholder*="Search"]'
    ).first();

    await expect(searchInput).toBeVisible({
        timeout: 10000
    });

    await searchInput.fill(phoneNumber);

    await page.waitForTimeout(2000);

    console.log(`Searching phone number: ${phoneNumber}`);

    // Step 6: Find customer row
    const customerRow = page.locator('tr').filter({
        hasText: phoneNumber
    }).last();

    await expect(customerRow).toBeVisible({
        timeout: 15000
    });

    console.log(`Customer found using phone number: ${phoneNumber}`);

    // Step 7: Click three-dot action menu
    const actionButton = customerRow.locator('button').last();

    await expect(actionButton).toBeVisible({
        timeout: 10000
    });

    await actionButton.click();

    await page.waitForTimeout(1000);

    console.log('Customer action menu opened');

    // Step 8: Click Edit Penalty
    const editPenaltyOption = page.getByText('Edit Penalty', {
        exact: true
    }).last();

    await expect(editPenaltyOption).toBeVisible({
        timeout: 10000
    });

    await editPenaltyOption.click();

    await page.waitForTimeout(2000);

    console.log('Edit Penalty page opened successfully');

    // Step 9: Locate Penalty Amount input
    const penaltyAmountInput = page.locator('input:visible').last();

    await expect(penaltyAmountInput).toBeVisible({
        timeout: 10000
    });

    // Step 10: Enter new Penalty Amount
    await penaltyAmountInput.fill('300');

    await page.waitForTimeout(1000);

    console.log('Penalty Amount changed to 300');

    // Step 11: Click Update Penalty
    const updatePenalty = page.getByText('Update Penalty', {
        exact: true
    }).last();

    await expect(updatePenalty).toBeVisible({
        timeout: 10000
    });

    await updatePenalty.scrollIntoViewIfNeeded();

    await updatePenalty.click();

    await page.waitForTimeout(2000);

    console.log('Update Penalty clicked successfully');

    // Step 12: Report
    console.log('====================================');
    console.log('      LOAN PENALTY EDIT REPORT');
    console.log('====================================');
    console.log(`Phone Number: ${phoneNumber}`);
    console.log('Updated Penalty Amount: 300');
    console.log('Status: Update Penalty clicked');
    console.log('====================================');

    // No logout.
    // Playwright automatically closes the browser after the test.

});
