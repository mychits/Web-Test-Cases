
const { test, expect } = require('@playwright/test');
const path = require('path');
require('dotenv').config();

test.use({
    storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Two Penalties for Different Customers - World Cricket', async ({ page }) => {

    test.setTimeout(240000);

    const baseURL = process.env.BASE_URL.replace(/\/$/, '');

    await page.goto(process.env.BASE_URL);
    await page.waitForTimeout(3000);

    if (await page.getByText('Admin Login').count() > 0) {
        throw new Error('Login session expired. Run LoginAutomation first.');
    }

    await page.goto(`${baseURL}/penalty-management`);

    await page.waitForTimeout(3000);

    function getDrawer() {
        return page.locator('.ant-drawer-content:visible').last();
    }

    function getPhone(text) {
        const match = text.match(/\b\d{10}\b/);
        return match ? match[0] : text.trim().toLowerCase();
    }

    // Select World Cricket
    async function selectGroup() {

        const drawer = getDrawer();

        await drawer.locator('.ant-select').nth(0).click();
        await page.waitForTimeout(1000);

        const option = page.locator('.ant-select-item-option:visible')
            .filter({ hasText: 'World Cricket' })
            .last();

        await expect(option).toBeVisible();
        await option.click();

        await page.waitForTimeout(1500);

        console.log('World Cricket selected');
    }

    // Select Customer or Ticket
    async function selectAnyOption(dropdownIndex, excludedCustomer = null) {

        const drawer = getDrawer();

        await drawer.locator('.ant-select').nth(dropdownIndex).click();
        await page.waitForTimeout(1000);

        const options = page.locator('.ant-select-item-option:visible');

        await expect(options.first()).toBeVisible();

        let selected = false;

        for (let i = 0; i < await options.count(); i++) {

            const option = options.nth(i);
            const optionText = (await option.innerText()).trim();

            if (
                optionText &&
                (!excludedCustomer ||
                    getPhone(optionText) !== getPhone(excludedCustomer))
            ) {
                await option.click();
                selected = true;
                break;
            }
        }

        if (!selected) {
            throw new Error('No different customer available in the dropdown.');
        }

        await page.waitForTimeout(1500);
    }

    // Read selected customer
    async function getCustomerDetails() {

        const customerText = (
            await getDrawer().locator('.ant-select').nth(1).innerText()
        ).trim();

        const dueMatch = customerText.match(
            /Due:\s*₹?\s*([\d,]+(?:\.\d+)?)/i
        );

        if (!dueMatch) {
            throw new Error(`Unable to read customer due balance: ${customerText}`);
        }

        return customerText;
    }

    // Fill amount fields
    async function fillAmount(fieldName, amount) {

        const fieldText = page.getByText(fieldName, {
            exact: true
        }).last();

        await expect(fieldText).toBeVisible({
            timeout: 30000
        });

        const input = fieldText.locator(
            'xpath=following::input[1]'
        );

        await expect(input).toBeVisible({
            timeout: 15000
        });

        await input.fill(String(amount));

        console.log(`${fieldName}: ₹${amount}`);
    }

    let firstCustomer = null;

    // Create two penalties
    for (let i = 1; i <= 2; i++) {

        console.log(`Adding Penalty ${i}`);

        // Open Add Penalty
        await page.getByText('Add Penalty', {
            exact: true
        }).click();

        await page.waitForTimeout(2000);

        // Select Group
        await selectGroup();

        // Select a different Customer
        await selectAnyOption(1, firstCustomer);

        const currentCustomer = await getCustomerDetails();

        console.log(`Selected customer: ${currentCustomer}`);

        if (i === 1) {
            firstCustomer = currentCustomer;
        } else if (
            getPhone(currentCustomer) === getPhone(firstCustomer)
        ) {
            throw new Error('Second penalty selected the same customer.');
        }

        // Select Ticket
        await selectAnyOption(2);

        console.log('Ticket selected');

        // Proceed to Add Penalty
        await page.getByText('Proceed to Add Penalty', {
            exact: true
        }).click();

        console.log('Waiting for Add Penalty form...');

        // Wait for the next form to load
        await page.waitForTimeout(5000);

        // Wait for Penalty Amount
        await fillAmount('Penalty Amount', 500);

        await page.waitForTimeout(1000);

        // Wait for Late Fee Amount
        await fillAmount('Late Fee Amount', 100);

        await page.waitForTimeout(1000);

        // Save Penalty
        const saveButton = page.getByRole('button', {
            name: 'Add Penalty & Late Fee'
        });

        await expect(saveButton).toBeVisible({
            timeout: 15000
        });

        await saveButton.click();

        await page.waitForTimeout(4000);

        console.log(`Penalty ${i} saved for ${currentCustomer}`);
    }

    console.log('Both penalties submitted.');
});
