
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Five Sub Admins - MyChits', async ({ page }) => {

  test.setTimeout(180000);

  const baseURL = process.env.BASE_URL.replace(/\/+$/, '');

  const subAdmins = [
    {
      name: 'Jack Rahul',
      phone: '9876501234',
      password: 'Jack@Rahul123',
      email: 'jack.rahul01@example.com'
    },
    {
      name: 'Jack Kiran',
      phone: '9876502345',
      password: 'Jack@Kiran123',
      email: 'jack.kiran02@example.com'
    },
    {
      name: 'Jack Arjun',
      phone: '9876503456',
      password: 'Jack@Arjun123',
      email: 'jack.arjun03@example.com'
    },
    {
      name: 'Jack Vikram',
      phone: '9876504567',
      password: 'Jack@Vikram123',
      email: 'jack.vikram04@example.com'
    },
    {
      name: 'Jack Sanjay',
      phone: '9876505678',
      password: 'Jack@Sanjay123',
      email: 'jack.sanjay05@example.com'
    }
  ];

  console.log('Opening MyChits Administrative Privileges page...');

  await page.goto(
    `${baseURL}/administrative-privileges`,
    { waitUntil: 'domcontentloaded' }
  );

  await page.waitForTimeout(2000);

  await expect(page).not.toHaveURL(/login/i);

  for (const admin of subAdmins) {

    console.log(`\nProcessing Sub Admin: ${admin.name}`);

    // Open Add Sub Admin form if it is not already visible.
    const nameInput = page.getByPlaceholder('Enter Sub Admin Name').last();

    if (!(await nameInput.isVisible().catch(() => false))) {

      await page.getByRole('button', {
        name: /Add Sub Admin/i
      }).first().click();

      await page.waitForTimeout(1000);
    }

    console.log('Filling Sub Admin Name...');

    await page.getByPlaceholder('Enter Sub Admin Name').last()
      .fill(admin.name);

    await page.waitForTimeout(500);

    console.log('Filling Phone Number...');

    await page.getByPlaceholder('Enter Sub Admin Phone Number').last()
      .fill(admin.phone);

    await page.waitForTimeout(500);

    console.log('Filling Password...');

    await page.getByPlaceholder('Enter Password').last()
      .fill(admin.password);

    await page.waitForTimeout(500);

    console.log('Filling Email...');

    await page.getByPlaceholder('Enter Sub Admin Email').last()
      .fill(admin.email);

    await page.waitForTimeout(500);

    // Select any available Admin Access Rights option.
    console.log('Selecting Admin Access Rights...');

    const dropdowns = page.locator(
      'select:visible, [role="combobox"]:visible'
    );

    const accessDropdown = dropdowns.last();

    await expect(accessDropdown).toBeVisible();

    const isNativeSelect = await accessDropdown.evaluate(
      el => el.tagName.toLowerCase() === 'select'
    );

    if (isNativeSelect) {

      const options = await accessDropdown.locator('option').evaluateAll(
        elements => elements.map(option => ({
          label: option.textContent.trim(),
          value: option.value,
          disabled: option.disabled
        }))
      );

      const availableOptions = options.filter(
        option => !option.disabled && option.value !== ''
      );

      console.log('Available Admin Access Rights:', availableOptions);

      if (availableOptions.length === 0) {
        throw new Error('No Admin Access Rights option available.');
      }

      // Choose any available option randomly.
      const randomOption = availableOptions[
        Math.floor(Math.random() * availableOptions.length)
      ];

      await accessDropdown.selectOption(randomOption.value);

      console.log(
        `Selected Admin Access Rights: ${randomOption.label}`
      );

    } else {

      await accessDropdown.click();

      await page.waitForTimeout(700);

      const availableOptions = page.locator('[role="option"]:visible');

      const optionCount = await availableOptions.count();

      if (optionCount === 0) {
        throw new Error('No Admin Access Rights option available.');
      }

      const optionTexts = await availableOptions.allInnerTexts();

      console.log('Available Admin Access Rights:', optionTexts);

      // Choose any available option randomly.
      const randomIndex = Math.floor(Math.random() * optionCount);

      const selectedOption = optionTexts[randomIndex].trim();

      await availableOptions.nth(randomIndex).click();

      console.log(
        `Selected Admin Access Rights: ${selectedOption}`
      );
    }

    await page.waitForTimeout(1000);

    // Wait for the actual Sub Admin creation API response.
    const createResponsePromise = page.waitForResponse(response =>
      response.url().includes('/api/admin/add-sub-admin') &&
      response.request().method().toUpperCase() === 'POST',
      { timeout: 30000 }
    );

    console.log(`Saving ${admin.name}...`);

    await page.getByRole('button', {
      name: /Save Sub Admin/i
    }).last().click();

    const response = await createResponsePromise;

    console.log('Sub Admin API URL:', response.url());
    console.log('Sub Admin API Method:', response.request().method());
    console.log('Sub Admin API Status:', response.status());

    const responseBody = await response.text();

    console.log('Sub Admin API Response:', responseBody);

    // Verify API success.
    expect(
      response.status(),
      `${admin.name} creation should return 201`
    ).toBe(201);

    const responseData = JSON.parse(responseBody);

    const createdAdmin = responseData._doc || responseData;

    expect(
      String(createdAdmin.name || '').toLowerCase()
    ).toBe(admin.name.toLowerCase());

    expect(String(createdAdmin.phoneNumber)).toBe(admin.phone);

    expect(
      String(createdAdmin.email || '').toLowerCase()
    ).toBe(admin.email.toLowerCase());

    console.log(
      `${admin.name} created and verified successfully.`
    );

    await page.waitForTimeout(1500);
  }

  console.log('\nAll five Sub Admins created successfully.');

  // Logout after completing all five creations.
  console.log('Logging out from MyChits...');

  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('branch');
  });

  await page.goto(baseURL, {
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(2000);

  await expect(page).toHaveURL(/\/$/);

  await expect(
    page.getByText(/Admin Login/i).first()
  ).toBeVisible();

  console.log('Logout successful.');
  console.log('Admin Login page displayed successfully.');
  console.log('Sub Admin test completed successfully.');

});
