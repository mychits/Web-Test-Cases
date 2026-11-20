
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
    storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Edit Guarantor Customer - Testgopinathe Rao', async ({ page }) => {

    test.setTimeout(300000);

    const baseURL = process.env.BASE_URL.replace(/\/+$/, '');
    const guarantorName = 'Testgopinathe Rao';
    const currentCustomer = 'Testchethan Kumar';

    // STEP 1: Open Guarantor page
    await page.goto(baseURL, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
    });

    await page.waitForTimeout(2000);

    await page.goto(`${baseURL}/legals-menu/guarantor`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
    });

    await page.waitForTimeout(3000);

    console.log('Guarantor page opened successfully');

    // STEP 2: Check login session
    const loginVisible = await page.getByText('Admin Login', {
        exact: true
    }).isVisible().catch(() => false);

    if (loginVisible) {
        throw new Error('Login session expired. Run LoginAutomation.spec.js first.');
    }

    // STEP 3: Find guarantor
    const row = page.locator('table tbody tr').filter({
        hasText: guarantorName
    });

    await expect(row).toHaveCount(1, {
        timeout: 15000
    });

    console.log(`Guarantor found: ${guarantorName}`);

    // STEP 4: Open three-dot menu
    const actionCell = row.locator('td').last();

    await actionCell.locator('svg').last().click();

    await page.waitForTimeout(1000);

    console.log('Three-dot action menu opened');

    // STEP 5: Click Edit
    const editMenu = page.locator(
        '.ant-dropdown:visible, .ant-dropdown-menu:visible, [role="menu"]:visible'
    ).last();

    await expect(editMenu).toBeVisible({
        timeout: 10000
    });

    await editMenu.getByText('Edit', {
        exact: true
    }).click();

    await page.waitForTimeout(2000);

    console.log('Edit Guarantor page opened successfully');

    // STEP 6: Find the existing Select Guarantor Customer value
    const selectedCustomer = page.getByText(currentCustomer, {
        exact: true
    }).last();

    await expect(selectedCustomer).toBeVisible({
        timeout: 15000
    });

    // Click the dropdown containing Testchethan Kumar
    await selectedCustomer.click();

    await page.waitForTimeout(1500);

    console.log('Guarantor customer dropdown opened');

    // STEP 7: Select another customer
    const options = page.locator(
        '.ant-select-item-option:visible, [role="option"]:visible'
    );

    await expect(options.first()).toBeVisible({
        timeout: 10000
    });

    const optionCount = await options.count();

    let newCustomerOption = null;
    let newCustomerName = '';

    for (let i = 0; i < optionCount; i++) {

        const option = options.nth(i);
        const optionName = (await option.innerText()).trim();

        const disabled = await option.getAttribute('aria-disabled');

        if (
            optionName &&
            optionName !== currentCustomer &&
            disabled !== 'true'
        ) {
            newCustomerOption = option;
            newCustomerName = optionName;
            break;
        }
    }

    expect(
        newCustomerOption,
        'No different customer found in dropdown'
    ).not.toBeNull();

    await newCustomerOption.click();

    await page.waitForTimeout(1000);

    console.log(`New customer selected: ${newCustomerName}`);

    // STEP 8: Click Update
    const updateButton = page.getByText('Update', {
        exact: true
    }).last();

    await expect(updateButton).toBeVisible({
        timeout: 10000
    });

    await updateButton.scrollIntoViewIfNeeded();

    await updateButton.click();

    await page.waitForTimeout(2000);

    console.log('Update button clicked successfully');

    console.log('-----------------------------------');
    console.log('GUARANTOR EDIT COMPLETED');
    console.log(`Guarantor: ${guarantorName}`);
    console.log(`Old Customer: ${currentCustomer}`);
    console.log(`New Customer: ${newCustomerName}`);
    console.log('-----------------------------------');

});
