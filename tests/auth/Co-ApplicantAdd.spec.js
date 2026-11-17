
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Three New Co-Applicants', async ({ page }) => {

  test.setTimeout(300000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const usedCustomers = new Set();

  await page.goto(baseURL);
  await page.waitForTimeout(2000);

  await page.goto(baseURL + 'legals-menu/co-applicant');
  await page.waitForTimeout(3000);

  if (await page.getByText('Admin Login', { exact: true }).isVisible().catch(() => false)) {
    throw new Error('Login session expired. Please run LoginAutomation.spec.js first.');
  }

  for (let i = 1; i <= 3; i++) {

    console.log(`Starting Co-Applicant ${i}`);

    // Open Add Co-Applicant
    await page.getByRole('button', { name: /add co.?applicant/i }).click();
    await page.waitForTimeout(1500);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const dropdowns = modal.locator('.ant-select-selector');

    // 1. Select Customer Name
    await dropdowns.nth(0).click();
    await page.waitForTimeout(1500);

    let options = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    );

    await expect(options.first()).toBeVisible({ timeout: 20000 });

    const customerCount = await options.count();
    const availableCustomers = [];

    for (let j = 0; j < customerCount; j++) {
      const name = (await options.nth(j).innerText()).trim();

      if (name && !usedCustomers.has(name)) {
        availableCustomers.push(name);
      }
    }

    if (availableCustomers.length === 0) {
      throw new Error('No different Customer Names available.');
    }

    const randomCustomer =
      availableCustomers[Math.floor(Math.random() * availableCustomers.length)];

    usedCustomers.add(randomCustomer);

    await options.filter({ hasText: randomCustomer }).first().click();

    console.log(`Selected Customer: ${randomCustomer}`);

    await page.waitForTimeout(1500);

    // 2. Select Enrollment
    await dropdowns.nth(1).click();
    await page.waitForTimeout(1500);

    const enrollmentOptions = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    );

    await expect(enrollmentOptions.first()).toBeVisible({
      timeout: 20000
    });

    const enrollmentCount = await enrollmentOptions.count();

    console.log(`Available Enrollments: ${enrollmentCount}`);

    const randomEnrollmentIndex =
      Math.floor(Math.random() * enrollmentCount);

    const selectedEnrollment =
      (await enrollmentOptions.nth(randomEnrollmentIndex).innerText()).trim();

    await enrollmentOptions.nth(randomEnrollmentIndex).click();

    console.log(`Selected Enrollment: ${selectedEnrollment}`);

    // Wait 2 seconds, then close Enrollment dropdown
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');

    console.log('Enrollment dropdown closed');

    await page.waitForTimeout(1000);

    // 3. Select Referred Type - Customer
    await dropdowns.nth(2).click();
    await page.waitForTimeout(1000);

    options = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    );

    await expect(
      options.filter({ hasText: /^Customer$/ }).first()
    ).toBeVisible({ timeout: 20000 });

    await options.filter({ hasText: /^Customer$/ }).click();

    console.log('Selected Referred Type: Customer');

    await page.waitForTimeout(1500);

    // 4. Select Additional Customer
    await expect(dropdowns.nth(3)).toBeVisible({ timeout: 15000 });

    await dropdowns.nth(3).click();
    await page.waitForTimeout(1500);

    const additionalCustomerOptions = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    );

    await expect(additionalCustomerOptions.first()).toBeVisible({
      timeout: 20000
    });

    const additionalCustomerCount =
      await additionalCustomerOptions.count();

    const randomAdditionalCustomer =
      Math.floor(Math.random() * additionalCustomerCount);

    const additionalCustomerName =
      (await additionalCustomerOptions.nth(randomAdditionalCustomer).innerText()).trim();

    await additionalCustomerOptions.nth(randomAdditionalCustomer).click();

    console.log(`Selected Additional Customer: ${additionalCustomerName}`);

    await page.waitForTimeout(1500);

    // 5. Enter Description
    const description = modal.getByRole('textbox').last();

    await description.fill(
      'Co-Applicant added through Playwright automation.'
    );

    console.log('Description entered successfully');

    await page.waitForTimeout(1000);

    // 6. Save Co-Applicant
    await modal.getByRole('button', { name: /save co.?applicant/i }).click();

    await page.waitForTimeout(3000);

    await expect(modal).toBeHidden({ timeout: 15000 });

    console.log(`Co-Applicant ${i} saved successfully`);

    await page.waitForTimeout(1500);
  }

  console.log('All three Co-Applicants added successfully.');

});
