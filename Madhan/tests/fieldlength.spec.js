const { test, expect } = require('@playwright/test');

test('MyChits - Automatically create and save a group', async ({ page }) => {
  test.setTimeout(0);

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const BASE_URL = 'http://localhost:5173/';
  const GROUP_URL = 'http://localhost:5173/add-new-group';

  const BRANCH_NAME = 'Test Branch (CF-BR-1)';
  const ADMIN_ID = 'MCF-AD-1';
  const OTP = '888888';

  // Sample group data
  const GROUP = {
    name: 'Chits Automation',
    vacancySeats: '5',
    groupValue: '100000',
    groupInstallment: '1000',
    groupMembers: '20',
    dailyInstallment: '100',
    weeklyInstallment: '500',
    monthlyInstallment: '2000',
    groupDuration: '12',
    registrationFee: '100',
    minimumBid: '1',
    maximumBid: '10',
    agentCommission: '1',
    companyCommission: '5',
    employeeIncentives: '1',
  };

  // ==========================================
  // HELPER: FILL A FIELD BY PLACEHOLDER
  // ==========================================
  async function fillPlaceholder(placeholder, value) {
    const field = page.getByPlaceholder(placeholder, {
      exact: true,
    }).first();

    await expect(
      field,
      `Field not found: ${placeholder}`
    ).toBeVisible({ timeout: 10000 });

    await field.fill(value);

    console.log(`Filled "${placeholder}" with "${value}"`);
  }

  // ==========================================
  // HELPER: FILL INPUT USING ITS LABEL
  // ==========================================
  async function fillLabel(label, value) {
    const field = page.getByLabel(label, {
      exact: false,
    }).first();

    await expect(
      field,
      `Field not found for label: ${label}`
    ).toBeVisible({ timeout: 10000 });

    await field.fill(value);

    console.log(`Filled "${label}" with "${value}"`);
  }

  // ==========================================
  // HELPER: SELECT A DROPDOWN OPTION
  // Supports native HTML select and common
  // custom dropdowns.
  // ==========================================
  async function selectDropdown(label, preferredOption) {
    console.log(`Selecting ${label}...`);

    // Find a native select associated with the label.
    const nativeSelect = page.locator('select').filter({
      visible: true,
    });

    const selectsCount = await nativeSelect.count();

    for (let i = 0; i < selectsCount; i++) {
      const select = nativeSelect.nth(i);

      const details = await select.evaluate(el => ({
        name: el.name,
        id: el.id,
        ariaLabel: el.getAttribute('aria-label'),
        options: Array.from(el.options).map(option => ({
          text: option.textContent.trim(),
          value: option.value,
        })),
      }));

      const nearbyLabel = await select.evaluate(el => {
        const parent = el.parentElement?.parentElement;
        return parent?.innerText || '';
      });

      const matchesLabel =
        details.name.toLowerCase().includes(label.toLowerCase()) ||
        details.id.toLowerCase().includes(label.toLowerCase()) ||
        (details.ariaLabel || '').toLowerCase().includes(label.toLowerCase()) ||
        nearbyLabel.toLowerCase().includes(label.toLowerCase());

      if (matchesLabel) {
        const option = details.options.find(item =>
          item.text.toLowerCase().includes(preferredOption.toLowerCase())
        );

        if (option) {
          await select.selectOption(option.value);
          console.log(`${label} selected: ${option.text}`);
          return;
        }

        const availableOptions = details.options
          .filter(item => item.value)
          .map(item => item.text);

        throw new Error(
          `Option "${preferredOption}" not found for ${label}. ` +
          `Available options: ${availableOptions.join(', ')}`
        );
      }
    }

    // Try a custom dropdown identified by visible text.
    const dropdownLabel = page.getByText(label, {
      exact: true,
    }).first();

    await expect(dropdownLabel).toBeVisible({
      timeout: 10000,
    });

    // Click the label and then the associated dropdown control.
    const container = dropdownLabel.locator('xpath=..');

    const control = container.locator(
      'button, [role="combobox"], [role="button"]'
    ).first();

    if (await control.count()) {
      await control.click();
    } else {
      await dropdownLabel.click();
    }

    const option = page.getByText(preferredOption, {
      exact: true,
    }).last();

    await expect(option).toBeVisible({
      timeout: 10000,
    });

    await option.click();

    console.log(`${label} selected: ${preferredOption}`);
  }

  // ==========================================
  // STEP 1: OPEN MYCHITS
  // ==========================================
  console.log('\nSTEP 1: Opening MyChits');

  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  console.log('Current URL:', page.url());

  // ==========================================
  // STEP 2: LOGIN AUTOMATICALLY
  // ==========================================
  const loginHeading = page.getByRole('heading', {
    name: /admin login/i,
  });

  if (await loginHeading.isVisible().catch(() => false)) {
    console.log('Login page detected.');

    await page.locator('select').first().selectOption({
      label: BRANCH_NAME,
    });

    await page.getByPlaceholder('XXX-XX-XXXX').fill(ADMIN_ID);

    await page.getByRole('button', {
      name: /send otp/i,
    }).click();

    console.log('OTP requested.');

    const otpInputs = page.locator(
      'input[autocomplete="one-time-code"], ' +
      'input[name*="otp" i], ' +
      'input[placeholder*="otp" i], ' +
      'input[inputmode="numeric"], ' +
      'input[maxlength="6"]'
    );

    await expect(otpInputs.first()).toBeVisible({
      timeout: 20000,
    });

    const otpCount = await otpInputs.count();

    if (otpCount === 1) {
      await otpInputs.first().fill(OTP);
    } else if (otpCount === 6) {
      for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(OTP[i]);
      }
    } else {
      throw new Error(`Unexpected OTP input count: ${otpCount}`);
    }

    await page.getByRole('button', {
      name: /verify otp|verify|submit|confirm|login/i,
    }).last().click();

    await expect(loginHeading).toBeHidden({
      timeout: 30000,
    });

    console.log('Login successful.');
  } else {
    console.log('Login form not displayed; checking existing session.');
  }

  // ==========================================
  // STEP 3: OPEN ADD NEW GROUP
  // ==========================================
  console.log('\nSTEP 3: Opening Add New Group');

  await page.goto(GROUP_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.waitForTimeout(1500);

  console.log('Add New Group URL:', page.url());

  // ==========================================
  // STEP 4: FILL GROUP NAME
  // ==========================================
  console.log('\nSTEP 4: Filling group details');

  await fillPlaceholder(
    'Enter the Group Name',
    GROUP.name
  );

  // ==========================================
  // STEP 5: SELECT GROUP TYPE
  // ==========================================
  await selectDropdown(
    'Group Type',
    'Daily'
  );

  // ==========================================
  // STEP 6: SELECT RELATIONSHIP MANAGER
  // ==========================================
  // This example expects an option called Test RM.
  // Change it to an actual option available in your app.
  await selectDropdown(
    'Relationship Manager',
    'Test RM'
  );

  // ==========================================
  // STEP 7: FILL NUMERIC FIELDS
  // ==========================================
  await fillPlaceholder(
    'Enter App Display Vacancy Seat',
    GROUP.vacancySeats
  );

  await fillPlaceholder(
    'Enter Group Value',
    GROUP.groupValue
  );

  await fillPlaceholder(
    'Enter Group Installment',
    GROUP.groupInstallment
  );

  await fillPlaceholder(
    'Enter Group Members',
    GROUP.groupMembers
  );

  await fillPlaceholder(
    'Enter Daily Installment',
    GROUP.dailyInstallment
  );

  await fillPlaceholder(
    'Enter Weekly Installment',
    GROUP.weeklyInstallment
  );

  await fillPlaceholder(
    'Enter Monthly Installment',
    GROUP.monthlyInstallment
  );

  await fillPlaceholder(
    'Enter Group Duration',
    GROUP.groupDuration
  );

  await fillPlaceholder(
    'Enter Registration Fee',
    GROUP.registrationFee
  );

  // ==========================================
  // STEP 8: SELECT START DATE TYPE
  // ==========================================
  const fixedRadio = page.getByLabel('Fixed', {
    exact: true,
  });

  if (await fixedRadio.count()) {
    await fixedRadio.check();
  } else {
    await page.getByText('Fixed', {
      exact: true,
    }).click();
  }

  // ==========================================
  // STEP 9: FILL START AND END DATES
  // ==========================================
  // Date values use dd-mm-yyyy as displayed in the form.
  // Adjust the format if the application expects another one.

  await fillPlaceholder('dd-mm-yyyy', '27-10-2026');

  // If there are two date fields with the same placeholder,
  // fill the second one as the end date.
  const dateFields = page.getByPlaceholder('dd-mm-yyyy', {
    exact: true,
  });

  const dateCount = await dateFields.count();

  if (dateCount >= 2) {
    await dateFields.nth(1).fill('27-10-2027');
    console.log('End date filled: 27-10-2027');
  }

  // ==========================================
  // STEP 10: FILL BID PERCENTAGES
  // ==========================================
  await fillPlaceholder(
    'Enter Minimum Bid %',
    GROUP.minimumBid
  );

  await fillPlaceholder(
    'Enter Maximum Bid %',
    GROUP.maximumBid
  );

  // ==========================================
  // STEP 11: FILL COMMISSION VALUES
  // ==========================================
  await fillLabel(
    'Agent Commission %',
    GROUP.agentCommission
  );

  await fillLabel(
    'Company Commission %',
    GROUP.companyCommission
  );

  await fillLabel(
    'Employee Incentives %',
    GROUP.employeeIncentives
  );

  // ==========================================
  // STEP 12: INSPECT AUCTION CONFIGURATION
  // ==========================================
  console.log('\nChecking Auction Configuration...');

  const auctionHeading = page.getByText(
    'AUCTION CONFIGURATION',
    { exact: true }
  );

  if (await auctionHeading.isVisible().catch(() => false)) {
    console.log('Auction Configuration section found.');
    await auctionHeading.click();

    await page.waitForTimeout(500);

    console.log(
      'Auction configuration opened. Review required fields below.'
    );
  }

  // Show all visible inputs to help identify any remaining
  // required fields that are not covered by this script.
  const visibleFields = await page.locator(
    'input:visible, textarea:visible, select:visible'
  ).evaluateAll(elements =>
    elements.map((el, index) => ({
      index,
      tag: el.tagName,
      type: el.type || '',
      name: el.name || '',
      placeholder: el.placeholder || '',
      value: el.value || '',
      required: el.required || false,
    }))
  );

  console.log('\nCurrent form fields:');
  console.table(visibleFields);

  await page.screenshot({
    path: 'mychits-add-group-filled.png',
    fullPage: true,
  });

  // ==========================================
  // STEP 13: SAVE GROUP
  // ==========================================
  console.log('\nSTEP 13: Saving group');

  const saveButton = page.getByRole('button', {
    name: /save group|save|create group|add group|submit/i,
  }).last();

  await expect(saveButton).toBeVisible({
    timeout: 15000,
  });

  await expect(saveButton).toBeEnabled();

  await saveButton.click();

  console.log('Save button clicked.');

  // Wait for a success notification or navigation.
  const successMessage = page.getByText(
    /group created successfully|group added successfully|successfully created|successfully saved|group saved successfully/i
  ).first();

  const successVisible = await successMessage.isVisible({
    timeout: 10000,
  }).catch(() => false);

  if (successVisible) {
    console.log('SUCCESS: Group creation message displayed.');
  } else {
    console.log(
      'No known success message found. Check the form for validation errors.'
    );
  }

  await page.screenshot({
    path: 'mychits-group-save-result.png',
    fullPage: true,
  });

  console.log('\nGroup form submission attempted.');
  console.log('Review the browser and terminal to confirm the result.');

  // ==========================================
  // STEP 14: LEAVE LOGOUT MANUAL
  // ==========================================
  console.log('\nBrowser will remain open.');
  console.log('Log out manually when you are ready.');

  await page.pause();
});