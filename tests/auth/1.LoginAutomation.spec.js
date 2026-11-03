
require('dotenv').config();

const { test, expect } = require('@playwright/test');

// Read login details from .env
const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const BRANCH_NAME = process.env.BRANCH_NAME;
const OTP = process.env.OTP;

test('Login and Keep Dashboard Open for Manual Logout', async ({ page }) => {

    test.setTimeout(0);

    // Check environment variables
    if (!BASE_URL || !ADMIN_ID || !BRANCH_NAME || !OTP) {
        throw new Error('Missing values in .env file');
    }

    // STEP 1: Open website
    await page.goto(BASE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
    });

    console.log('Website opened:', page.url());

    // STEP 2: Login if login page appears
    const loginHeading = page.getByRole('heading', {
        name: 'Admin Login'
    });

    if (await loginHeading.isVisible().catch(() => false)) {

        // Select branch
        await page.locator('select').first().selectOption({
            label: BRANCH_NAME
        });

        console.log('Branch selected');

        // Enter admin ID
        await page.getByPlaceholder('XXX-XX-XXXX')
            .fill(ADMIN_ID);

        console.log('Admin ID entered');

        // Click Send OTP
        await page.getByRole('button', {
            name: /send otp/i
        }).click();

        console.log('Send OTP clicked');

        // Find OTP input
        const otpInputs = page.locator(
            'input[autocomplete="one-time-code"], ' +
            'input[name*="otp" i], ' +
            'input[placeholder*="otp" i], ' +
            'input[inputmode="numeric"], ' +
            'input[maxlength="6"]'
        );

        await expect(otpInputs.first()).toBeVisible({
            timeout: 20000
        });

        // Enter OTP
        const otpCount = await otpInputs.count();

        if (otpCount === 1) {

            await otpInputs.first().fill(OTP);

        } else if (otpCount === 6) {

            for (let i = 0; i < 6; i++) {
                await otpInputs.nth(i).fill(OTP[i]);
            }

        } else {

            throw new Error(
                `Unexpected OTP input count: ${otpCount}`
            );
        }

        console.log('OTP entered');

        // Verify login
        const verifyButton = page.getByRole('button', {
            name: /verify otp|verify|submit|confirm|login/i
        }).last();

        await expect(verifyButton).toBeVisible();

        await verifyButton.click();

        // Wait for login completion
        await expect(loginHeading).toBeHidden({
            timeout: 30000
        });

        console.log('Login completed.');
    }

    // STEP 3: Save authenticated session
    await page.context().storageState({
        path: 'auth-state.json'
    });

    console.log('Login session saved successfully.');

    // STEP 4: Keep dashboard open
    console.log('Current dashboard URL:', page.url());

    console.log(
        'You can now log out manually using the dashboard.'
    );

    // STEP 5: Pause browser for manual observation
    await page.pause();

});
