
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
    storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('View Penalty Statement for Testvinay S', async ({ page }) => {

    test.setTimeout(60000);

    const baseUrl = process.env.BASE_URL.replace(/\/$/, '');

    // Open dashboard using saved login.
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Logged in successfully');

    // Open Penalty Management.
    await page.goto(`${baseUrl}/penalty-management`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Opened Penalty Management');

    const table = page.locator('table').first();

    await expect(table).toBeVisible();

    // Find CUSTOMER column.
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

    expect(customerColumnIndex).toBeGreaterThanOrEqual(0);

    // Find Testvinay S.
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();

    let customerRow = null;

    for (let i = 0; i < rowCount; i++) {

        const row = rows.nth(i);
        const cells = row.locator('td');

        if (await cells.count() <= customerColumnIndex) {
            continue;
        }

        const customerName = (await cells
            .nth(customerColumnIndex)
            .innerText()).trim();

        if (customerName === 'Testvinay S') {
            customerRow = row;
            break;
        }
    }

    expect(customerRow).not.toBeNull();

    console.log('Found customer: Testvinay S');

    // Click three-dot action menu.
    const actionCell = customerRow.locator('td').last();

    const actionButtons = actionCell.locator(
        'button, [role="button"]'
    );

    if (await actionButtons.count() > 0) {
        await actionButtons.last().click();
    } else {
        await actionCell.locator('svg').last().click();
    }

    await page.waitForTimeout(1000);

    // Click View Statement.
    await page.getByText('View Statement', {
        exact: true
    }).last().click();

    console.log('Clicked View Statement');

    // Wait 3 seconds after opening statement.
    await page.waitForTimeout(3000);

    console.log('Waited 3 seconds after opening statement');

    // Return to dashboard for logout.
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Returned to dashboard for logout');

    // Try the visible Logout option.
    const logoutButton = page.getByText('Logout', {
        exact: true
    }).last();

    if (await logoutButton.count() > 0 &&
        await logoutButton.isVisible()) {

        await logoutButton.click();
        await page.waitForTimeout(2000);

        console.log('Logged out using Logout button');

    } else {

        // Fallback: clear the same authentication data
        // that the application's logout function removes.
        await page.evaluate(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('admin');
            localStorage.removeItem('branch');
        });

        await page.goto(baseUrl);
        await page.waitForLoadState('domcontentloaded');

        console.log('Logged out by clearing saved authentication data');
    }

    console.log('Test completed successfully');

});
