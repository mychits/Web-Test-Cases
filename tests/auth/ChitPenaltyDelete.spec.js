
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
    storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete All Blr- Customer Penalties on Current Page', async ({ page }) => {

    const baseUrl = process.env.BASE_URL.replace(/\/$/, '');

    await page.goto(`${baseUrl}/penalty-management`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Opened Penalty Management');

    const table = page.locator('table').first();

    await expect(table).toBeVisible();

    // Find the exact CUSTOMER column.
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

    let deletedCount = 0;

    // Keep searching the CURRENT PAGE after every deletion.
    while (true) {

        const rows = table.locator('tbody tr');
        const rowCount = await rows.count();

        let matchingRowFound = false;

        for (let i = 0; i < rowCount; i++) {

            const row = rows.nth(i);
            const cells = row.locator('td');

            if (await cells.count() <= customerColumnIndex) {
                continue;
            }

            const customerName = (await cells
                .nth(customerColumnIndex)
                .innerText()).trim();

            // Match every customer starting with Blr-.
            if (!customerName.startsWith('Blr-')) {
                continue;
            }

            matchingRowFound = true;

            console.log(`Found customer: ${customerName}`);

            // Open the action menu for the matching row.
            const actionCell = cells.last();
            const actionButtons = actionCell.locator(
                'button, [role="button"]'
            );

            if (await actionButtons.count() > 0) {
                await actionButtons.last().click();
            } else {
                await actionCell.locator('svg').last().click();
            }

            await page.waitForTimeout(500);

            // Click Delete Penalty.
            await page.getByText('Delete Penalty', {
                exact: true
            }).last().click();

            await page.waitForTimeout(500);

            // Confirm deletion.
            await page.getByRole('button', {
                name: 'Yes',
                exact: true
            }).last().click();

            await page.waitForTimeout(1500);

            deletedCount++;

            console.log(
                `Deleted ${deletedCount}: ${customerName}`
            );

            // Search the current page again after deletion.
            break;
        }

        // No matching customer remains on the current page.
        if (!matchingRowFound) {
            console.log('No more Blr- customers found on the current page.');
            break;
        }
    }

    console.log('====================================');
    console.log(`Total Blr- penalties deleted: ${deletedCount}`);
    console.log('Only the current page was checked.');
    console.log('====================================');

    expect(
        deletedCount,
        'No Blr- customer penalty records were found on the current page.'
    ).toBeGreaterThan(0);

});
