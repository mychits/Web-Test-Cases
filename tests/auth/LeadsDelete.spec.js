
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Delete My Created Leads', async ({ page }) => {
  test.setTimeout(120000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const leads = [
    { name: 'Jack Rahul', phone: '9576501054' },
    { name: 'Jack Karthik', phone: '9676501032' },
    { name: 'Jack Vikram', phone: '9976501094' },
    { name: 'Jack Praveen', phone: '9076501026' }
  ];

  // STEP 1: Open Leads page with saved login.
  await page.goto(`${baseURL}lead`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Website opened:', page.url());

  const loginVisible = await page
    .getByText('Admin Login', { exact: true })
    .isVisible()
    .catch(() => false);

  if (loginVisible) {
    throw new Error(
      'Login session expired. Run LoginAutomation.spec.js first.'
    );
  }

  console.log('Leads page opened successfully.');

  // STEP 2: Process each selected lead.
  for (const lead of leads) {
    console.log(`Searching for: ${lead.name}`);

    const phoneNumber = page.getByText(lead.phone, {
      exact: true
    }).first();

    await expect(phoneNumber).toBeVisible({
      timeout: 15000
    });

    const row = phoneNumber.locator('xpath=ancestor::tr[1]');

    await expect(row).toBeVisible();

    // STEP 3: Locate the ACTION column.
    const actionCell = row.locator('td').last();

    await expect(actionCell).toBeVisible();

    await actionCell.scrollIntoViewIfNeeded();

    // IMPORTANT: Click the actual three-dot SVG icon.
    const svgIcon = actionCell.locator('svg').last();

    if (await svgIcon.count() > 0) {
      await svgIcon.click();
    } else {
      throw new Error(
        `Three-dot SVG icon not found for ${lead.name}.`
      );
    }

    console.log(`Three-dot icon clicked for: ${lead.name}`);

    // STEP 4: Wait for the dropdown menu to open.
    const dropdown = page.locator(
      '.ant-dropdown:visible, .ant-dropdown-menu:visible, [role="menu"]:visible'
    ).last();

    await expect(dropdown).toBeVisible({
      timeout: 10000
    });

    console.log(
      'Dropdown menu:',
      await dropdown.innerText()
    );

    // STEP 5: Select the exact Remove option.
    const removeOption = dropdown
      .locator('.ant-dropdown-menu-item, [role="menuitem"]')
      .filter({
        hasText: /^Remove$/
      })
      .last();

    await expect(removeOption).toBeVisible({
      timeout: 10000
    });

    // Handle native browser confirmation.
    page.once('dialog', async dialog => {
      console.log('Browser confirmation:', dialog.message());
      await dialog.accept();
    });

    await removeOption.click();

    console.log(`Remove clicked for: ${lead.name}`);

    // STEP 6: Handle website confirmation dialog if present.
    const confirmation = page.locator(
      '.ant-modal:visible, [role="dialog"]:visible'
    ).last();

    if (await confirmation.isVisible().catch(() => false)) {
      const confirmButton = confirmation.getByRole('button', {
        name: /remove|yes|confirm|ok/i
      }).last();

      await expect(confirmButton).toBeVisible({
        timeout: 10000
      });

      await confirmButton.click();

      console.log(`Removal confirmed for: ${lead.name}`);
    }

    // STEP 7: Verify deletion.
    await expect(
      page.getByText(lead.phone, {
        exact: true
      })
    ).toHaveCount(0, {
      timeout: 15000
    });

    console.log(`Lead deleted successfully: ${lead.name}`);

    await page.waitForTimeout(1500);
  }

  console.log('All four leads processed successfully.');
});
