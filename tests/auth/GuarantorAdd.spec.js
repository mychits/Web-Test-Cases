
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Three New Guarantors', async ({ page }) => {

  test.setTimeout(300000);

  // Open website
  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/');
  await page.waitForTimeout(2000);

  // Open Guarantor page
  await page.goto('http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/legals-menu/guarantor');
  await page.waitForTimeout(3000);

  console.log('Guarantor page opened');

  // Select a random available option from a dropdown
  const selectDropdownOption = async (dialog, dropdownIndex, waitTime = 20000) => {

    const dropdown = dialog.getByRole('combobox').nth(dropdownIndex);

    await expect(dropdown).toBeVisible();
    await dropdown.click();

    console.log(`Opened dropdown ${dropdownIndex + 1}`);

    const options = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    );

    await expect(options.first()).toBeVisible({
      timeout: waitTime
    });

    await page.waitForTimeout(1000);

    const optionCount = await options.count();

    console.log(`Dropdown ${dropdownIndex + 1}: ${optionCount} options available`);

    if (optionCount === 0) {
      throw new Error(`No options available in dropdown ${dropdownIndex + 1}`);
    }

    // Select a random option
    const selectedIndex = Math.floor(Math.random() * optionCount);
    const selectedOption = options.nth(selectedIndex);

    const selectedText = await selectedOption.innerText();

    console.log(`Selecting option: ${selectedText}`);

    await selectedOption.click({
      timeout: 15000
    });

    await page.waitForTimeout(1000);

    console.log(`Dropdown ${dropdownIndex + 1} option selected`);

    return selectedText;
  };

  // Add one guarantor
  const addGuarantor = async (number) => {

    console.log(`Starting Guarantor ${number}`);

    await page.getByRole('button', {
      name: /add guarantor/i
    }).click();

    await page.waitForTimeout(1500);

    const dialog = page.getByRole('dialog');

    await expect(dialog).toBeVisible();

    // 1. Customer Name
    console.log('Selecting Customer Name');

    await selectDropdownOption(dialog, 0, 60000);

    // 2. Enrollment
    console.log('Selecting Enrollment');

    const enrollment = dialog.getByRole('combobox').nth(1);

    await enrollment.click();

    const enrollmentOptions = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    );

    await expect(enrollmentOptions.first()).toBeVisible({
      timeout: 20000
    });

    await page.waitForTimeout(1000);

    const enrollmentCount = await enrollmentOptions.count();

    console.log(`Enrollment options: ${enrollmentCount}`);

    if (enrollmentCount === 0) {
      throw new Error('No Enrollment options available');
    }

    const enrollmentIndex = Math.floor(Math.random() * enrollmentCount);
    const enrollmentOption = enrollmentOptions.nth(enrollmentIndex);

    const enrollmentText = await enrollmentOption.innerText();

    console.log(`Selecting Enrollment: ${enrollmentText}`);

    await enrollmentOption.click();

    console.log('Enrollment selected');

    // IMPORTANT: Close the multi-select Enrollment dropdown
    await page.keyboard.press('Escape');

    console.log('Enrollment dropdown closed');

    // Wait exactly 2 seconds
    await page.waitForTimeout(2000);

    // 3. Referred Type - Always Customer
    console.log('Opening Referred Type dropdown');

    const referredType = dialog.getByRole('combobox').nth(2);

    await expect(referredType).toBeVisible();
    await expect(referredType).toBeEnabled();

    await referredType.click();

    console.log('Referred Type dropdown opened');

    const customerOption = page.locator(
      '.ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)'
    ).filter({
      hasText: /^Customer$/
    });

    await expect(customerOption).toBeVisible({
      timeout: 20000
    });

    await customerOption.click();

    await page.waitForTimeout(1500);

    console.log('Referred Type selected: Customer');

    // 4. Guarantor Customer
    console.log('Selecting Guarantor Customer');

    await selectDropdownOption(dialog, 3, 60000);

    // 5. Description
    console.log('Entering Description');

    const description = dialog.getByRole('textbox').last();

    await expect(description).toBeVisible();

    await description.fill(`Guarantor automation test ${number}`);

    console.log(`Description entered for Guarantor ${number}`);

    await page.waitForTimeout(1000);

    // Save Guarantor
    console.log(`Saving Guarantor ${number}`);

    await dialog.getByRole('button', {
      name: /save guarantor/i
    }).click();

    await expect(dialog).toBeHidden({
      timeout: 20000
    });

    console.log(`Guarantor ${number} saved successfully`);

    await page.waitForTimeout(3000);
  };

  // Create three guarantors
  for (let i = 1; i <= 3; i++) {
    await addGuarantor(i);
  }

  console.log('All three guarantors created successfully');

  await page.waitForTimeout(3000);

});
