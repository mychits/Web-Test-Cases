
const { test, expect } = require('@playwright/test');
require('dotenv').config();

// =====================================
// CONFIGURATION
// =====================================

const BASE_URL = process.env.BASE_URL;
const BRANCH_NAME = process.env.BRANCH_NAME;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;

// =====================================
// LOGIN AUTOMATION V2
// =====================================

test(
  'Login and Keep Dashboard Open for Manual Logout',
  async ({ page }) => {

    test.setTimeout(10 * 60 * 1000);
    page.setDefaultTimeout(15000);

    // Validate environment variables
    for (const [key, value] of Object.entries({
      BASE_URL,
      BRANCH_NAME,
      ADMIN_ID,
      OTP
    })) {
      if (!value || !value.trim()) {
        throw new Error(`${key} is missing from .env`);
      }
    }

    // =====================================
    // STEP 1 - OPEN WEBSITE
    // =====================================

    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Website opened:', page.url());

    // =====================================
    // STEP 2 - SELECT BRANCH
    // =====================================

    const branch = page.locator('select').first();

    await expect(branch).toBeVisible({
      timeout: 30000
    });

    await expect.poll(
      async () => {
        const options =
          await branch.locator('option').allTextContents();

        return options.map(text => text.trim());
      },
      { timeout: 30000 }
    ).toContain(BRANCH_NAME.trim());

    await branch.selectOption({
      label: BRANCH_NAME.trim()
    });

    console.log(
      'Branch selected successfully:',
      BRANCH_NAME
    );

    // =====================================
    // STEP 3 - ENTER ADMIN ID
    // =====================================

    const adminInput = page.getByPlaceholder(
      'XXX-XX-XXXX'
    );

    await expect(adminInput).toBeVisible();

    await adminInput.fill(ADMIN_ID.trim());

    console.log('Admin ID entered successfully');

    // =====================================
    // STEP 4 - SEND OTP
    // =====================================

    const sendOtpButton = page.getByRole('button', {
      name: /send otp|request otp|continue/i
    }).first();

    await expect(sendOtpButton).toBeVisible();
    await expect(sendOtpButton).toBeEnabled();

    // Record authentication API statuses.
    // Avoid printing URLs containing credentials.
    page.on('response', response => {
      try {
        const pathname = new URL(response.url()).pathname;

        if (/otp|login|auth/i.test(pathname)) {
          console.log(
            'Auth API:',
            response.status(),
            pathname
          );
        }
      } catch {
        // Ignore invalid URLs.
      }
    });

    page.on('requestfailed', request => {
      try {
        const pathname = new URL(request.url()).pathname;

        if (/otp|login|auth/i.test(pathname)) {
          console.log(
            'Auth request failed:',
            pathname,
            request.failure()?.errorText
          );
        }
      } catch {
        // Ignore invalid URLs.
      }
    });

    await sendOtpButton.click();

    console.log('Send OTP button clicked');

    // =====================================
    // STEP 5 - WAIT FOR OTP FORM
    // =====================================

    const otpSelectors = [
      'input[autocomplete="one-time-code"]',
      'input[placeholder*="otp" i]',
      'input[name*="otp" i]',
      'input[id*="otp" i]',
      'input[maxlength="1"]',
      'input[inputmode="numeric"]'
    ].join(', ');

    const otpInputs = page.locator(
      otpSelectors
    ).filter({ visible: true });

    console.log('Waiting for OTP verification form...');

    try {

      await expect.poll(
        async () => {
          const count = await otpInputs.count();

          return count > 0;
        },
        {
          timeout: 30000,
          intervals: [500, 1000, 2000]
        }
      ).toBe(true);

    } catch {

      console.log('OTP input not detected');
      console.log('Current URL:', page.url());

      const visibleInputs = await page.locator(
        'input:visible'
      ).evaluateAll(elements =>
        elements.map(element => ({
          type: element.type,
          placeholder: element.placeholder,
          name: element.name,
          id: element.id,
          maxLength: element.maxLength
        }))
      );

      console.log(
        'Visible input fields:',
        visibleInputs
      );

      const bodyText = await page.locator('body')
        .innerText()
        .catch(() => '');

      console.log(
        'Page message:',
        bodyText.slice(0, 1000)
      );

      await page.screenshot({
        path: 'login-v2-otp-debug.png',
        fullPage: true
      });

      throw new Error(
        'OTP verification form did not appear. ' +
        'Check the server response, page message, ' +
        'and login-v2-otp-debug.png screenshot.'
      );
    }

    // =====================================
    // STEP 6 - ENTER OTP
    // =====================================

    const otpValue = OTP.trim();

    const splitInputs = page.locator(
      'input[maxlength="1"]:visible'
    );

    const splitCount = await splitInputs.count();

    if (splitCount === otpValue.length) {

      console.log('Split OTP fields detected');

      for (let i = 0; i < otpValue.length; i++) {
        await splitInputs.nth(i).fill(otpValue[i]);
      }

    } else {

      console.log('Single OTP field detected');

      const singleOtp = otpInputs.first();

      await expect(singleOtp).toBeVisible({
        timeout: 10000
      });

      await singleOtp.fill(otpValue);
    }

    console.log('OTP entered successfully');

    // =====================================
    // STEP 7 - VERIFY OTP
    // =====================================

    const verifyButton = page.getByRole('button', {
      name: /verify otp|verify|submit|login|sign in/i
    }).first();

    if (await verifyButton.isVisible().catch(() => false)) {

      await expect(verifyButton).toBeEnabled();

      await verifyButton.click();

      console.log('OTP verification submitted');

    } else {

      console.log(
        'No Verify button found; checking for automatic login'
      );
    }

    // =====================================
    // STEP 8 - VERIFY DASHBOARD
    // =====================================

    await expect(page).toHaveURL(
      /dashboard/i,
      { timeout: 30000 }
    );

    console.log('Admin login successful');
    console.log('Dashboard opened:', page.url());

    // =====================================
    // STEP 9 - KEEP BROWSER OPEN
    // =====================================

    console.log(
      'Dashboard ready for manual inspection'
    );

    //await page.pause();

  }
);
