
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Remaining Leads', async ({ page }) => {
  test.setTimeout(120000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  // ADD YOUR ORIGINAL REMAINING LEAD DETAILS HERE.
  // Each lead must contain:
  // name, phone, profession, source, needs.

  const leads = [
    {
      name: 'Jack Rahul',
      phone: '9576501054',
      profession: 'Self Employed',
      source: 'Social Media',
      needs: 'Savings'
    },
    {
      name: 'Jack Karthik',
      phone: '9676501032',
      profession: 'Employed',
      source: 'Social Media',
      needs: 'Savings'
    },
    {
      name: 'Jack Vikram',
      phone: '9976501094',
      profession: 'Employed',
      source: 'Social Media',
      needs: 'Savings'
    },
    {
      name: 'Jack Praveen',
      phone: '9076501026',
      profession: 'Employed',
      source: 'Social Media',
      needs: 'Savings'
    }
  ];

  await page.goto(`${baseURL}lead`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Leads page opened:', page.url());

  async function selectField(labelText, value) {
    const label = page.locator('label').filter({
      hasText: new RegExp(`^${labelText}\\s*\\*?$`, 'i')
    }).first();

    await expect(label).toBeVisible({ timeout: 10000 });

    const dropdown = label.locator('xpath=..').locator('.ant-select');

    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.click();

    const searchInput = dropdown.locator('input');

    if (await searchInput.count()) {
      await searchInput.fill(value);
    }

    const option = page.getByText(value, {
      exact: true
    }).filter({
      visible: true
    }).last();

    try {
      await expect(option).toBeVisible({ timeout: 8000 });
      await option.click();
    } catch (error) {
      const availableOptions = await page
        .locator('[role="option"], .ant-select-item-option')
        .filter({ visible: true })
        .allTextContents();

      console.log(
        `Could not find "${value}" in "${labelText}". Available options:`,
        availableOptions
      );

      throw error;
    }
  }

  async function openAddLeadForm() {
    await page.getByRole('button', {
      name: /add lead/i
    }).click();

    await expect(
      page.locator('input[name="lead_name"]')
    ).toBeVisible({ timeout: 10000 });
  }

  for (const lead of leads) {
    console.log(`Adding lead: ${lead.name}`);

    await openAddLeadForm();

    await page.locator('input[name="lead_name"]').fill(lead.name);
    await page.locator('input[name="lead_phone"]').fill(lead.phone);

    await selectField('Lead Work/Profession', lead.profession);
    await selectField('Lead Source Type', lead.source);
    await selectField('Lead Needs and Goals', lead.needs);

    const saveButton = page.getByRole('button', {
      name: /save lead/i
    });

    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(
      page.locator('input[name="lead_name"]')
    ).toBeHidden({ timeout: 15000 });

    console.log(`Lead saved: ${lead.name}`);

    await page.waitForTimeout(1500);
  }

  console.log('All remaining leads processed.');
});
