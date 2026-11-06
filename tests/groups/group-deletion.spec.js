
require('dotenv').config();

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL;
const ADMIN_ID = process.env.ADMIN_ID;
const OTP = process.env.OTP;
const BRANCH_NAME = process.env.BRANCH_NAME;

// Exact details of the ONE group created by automation.
const TARGET_GROUP_NAME = process.env.AUTOMATED_GROUP_NAME;
const TARGET_GROUP_CODE = process.env.AUTOMATED_GROUP_CODE;

// Safety: disabled by default.
const ENABLE_DELETE =
  process.env.ENABLE_GROUP_DELETE === 'true';

if (!BASE_URL || !ADMIN_ID || !OTP || !BRANCH_NAME) {
  throw new Error('Missing login details in .env');
}

if (!TARGET_GROUP_NAME || !TARGET_GROUP_CODE) {
  throw new Error(
    'Set AUTOMATED_GROUP_NAME and AUTOMATED_GROUP_CODE in .env'
  );
}

if (!/^QA-AUTO-GROUP-\d+$/.test(TARGET_GROUP_NAME)) {
  throw new Error(
    'Target group name must match QA-AUTO-GROUP-<timestamp>'
  );
}

const ROOT_URL = BASE_URL.replace(/\/+$/, '') + '/';

async function visible(locator) {
  return locator.first().isVisible().catch(() => false);
}

function exactText(value) {
  return new RegExp(
    `^\\s*${String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`
  );
}

// =======================================
// LOGIN
// =======================================

async function login(page) {
  await page.goto(ROOT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const heading = page.getByRole('heading', {
    name: /admin login/i
  });

  if (!(await visible(heading))) {
    console.log('[Login] Existing session detected');
    return;
  }

  await page.locator('select').first().selectOption({
    label: BRANCH_NAME
  });

  await page.getByPlaceholder('XXX-XX-XXXX')
    .fill(ADMIN_ID);

  await page.getByRole('button', {
    name: /send otp/i
  }).click();

  const otpInputs = page.locator(
    'input[autocomplete="one-time-code"], ' +
    'input[name*="otp" i], ' +
    'input[placeholder*="otp" i], ' +
    'input[inputmode="numeric"], ' +
    'input[maxlength="6"]'
  );

  await expect(otpInputs.first()).toBeVisible({
    timeout: 30000
  });

  const count = await otpInputs.count();

  if (count === 1) {
    await otpInputs.first().fill(String(OTP));
  } else if (count === 6) {
    if (String(OTP).length !== 6) {
      throw new Error('Expected six-digit OTP');
    }

    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill(String(OTP)[i]);
    }
  } else {
    throw new Error(
      `Unexpected OTP input count: ${count}`
    );
  }

  await page.getByRole('button', {
    name: /verify otp|verify|login|submit/i
  }).last().click();

  await expect(heading).toBeHidden({
    timeout: 60000
  });

  console.log('[Login] Successful');
}

// =======================================
// OPEN GROUP MANAGEMENT
// =======================================

async function openGroups(page) {
  const groupsMenu = page.getByText('Groups', {
    exact: true
  });

  await expect(groupsMenu.first()).toBeVisible({
    timeout: 30000
  });

  // Click the sidebar Groups item if necessary.
  if (!(await visible(
    page.getByRole('heading', {
      name: 'Group Management'
    })
  ))) {
    await groupsMenu.first().click();
  }

  await expect(
    page.getByText('Group Management', {
      exact: true
    })
  ).toBeVisible({
    timeout: 30000
  });

  console.log('[Groups] Group Management opened');
}

// =======================================
// IDENTIFY EXACT GROUP ROW
// =======================================

async function findTargetRow(page) {
  // Screenshot shows a table with:
  // SL NO | GROUP CODE | GROUP NAME |
  // GROUP TYPE | GROUP VALUE | ACTION

  const rows = page.locator('table tbody tr');

  await expect(rows.first()).toBeVisible({
    timeout: 30000
  });

  const matches = rows.filter({
    has: page.getByText(TARGET_GROUP_NAME, {
      exact: true
    })
  });

  const count = await matches.count();

  if (count !== 1) {
    throw new Error(
      `Expected exactly one group named "${TARGET_GROUP_NAME}", ` +
      `but found ${count}. No deletion performed.`
    );
  }

  const row = matches.first();

  // Verify the group code in its own column.
  const cells = row.locator('td');

  const cellTexts = (await cells.allTextContents())
    .map(text => text.replace(/\s+/g, ' ').trim());

  if (!cellTexts.includes(TARGET_GROUP_CODE)) {
    throw new Error(
      `Group code "${TARGET_GROUP_CODE}" was not found ` +
      `as an exact table cell value. ` +
      `Row values: ${JSON.stringify(cellTexts)}. ` +
      `No deletion performed.`
    );
  }

  console.log('[Group] Verified name:', TARGET_GROUP_NAME);
  console.log('[Group] Verified code:', TARGET_GROUP_CODE);

  return row;
}

// =======================================
// DELETE ONE VERIFIED GROUP
// =======================================

async function deleteTargetGroup(page) {
  const row = await findTargetRow(page);

  if (!ENABLE_DELETE) {
    console.log('[DRY RUN] Exact target verified.');
    console.log('[DRY RUN] Deletion disabled.');
    return;
  }

  // Screenshot: three-dot action menu in final column.
  const actionCell = row.locator('td').last();

  const actionButton = actionCell.locator(
    'button, [role="button"]'
  ).first();

  if (await visible(actionButton)) {
    await actionButton.click();
  } else {
    // Fallback for an icon-only clickable element.
    const dots = actionCell.getByText(
      /^[⋮︙]$/
    ).first();

    await expect(dots).toBeVisible({
      timeout: 10000
    });

    await dots.click();
  }

  console.log('[Action] Three-dot menu opened');

  // Screenshot: Edit, Delete, Copy, Close Group.
  // Select only the exact Delete action.
  const deleteAction = page.getByText('Delete', {
  exact: true
}).locator('visible=true');

  await expect(deleteAction).toHaveCount(1, {
    timeout: 10000
  });

  await deleteAction.click();

  console.log('[Action] Delete selected');

  // Handle a confirmation dialog if the app displays one.
  const dialog = page.locator(
    '[role="alertdialog"]:visible, ' +
    '[role="dialog"]:visible, ' +
    '.ant-modal:visible, ' +
    '.ant-popconfirm:visible'
  ).last();

  if (await visible(dialog)) {
    const dialogText = await dialog.innerText();

    console.log('[Confirm] Dialog:', dialogText);

    // Stop if the confirmation names a different group.
    // A generic confirmation is allowed only because the
    // exact group row was already verified.
    const otherGroupName =
      dialogText.match(/QA-AUTO-GROUP-\d+/)?.[0];

    if (
      otherGroupName &&
      otherGroupName !== TARGET_GROUP_NAME
    ) {
      throw new Error(
        'Confirmation refers to a different group. Stopped.'
      );
    }

    const confirm = dialog.getByRole('button', {
      name: /^(delete|confirm|yes|yes, delete|ok|okay)$/i
    }).last();

    await expect(confirm).toBeVisible({
      timeout: 10000
    });

    await confirm.click();

    console.log('[Confirm] Delete confirmed');
  }

  // Verify the row disappears.
  await expect(row).toHaveCount(0, {
    timeout: 30000
  });

  console.log(
    `[Deleted] ${TARGET_GROUP_NAME} (${TARGET_GROUP_CODE})`
  );
}

// =======================================
// MAIN TEST
// =======================================

test('Delete only my automation-created group', async ({
  page
}) => {
  test.setTimeout(180000);

  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);

  try {
    await login(page);

    await openGroups(page);

    await deleteTargetGroup(page);

    console.log('[Completed] Group deletion flow finished');
  } catch (error) {
    console.error('[Error]', error.message);
    console.error('[URL]', page.url());

    await page.screenshot({
      path: 'group-deletion-error.png',
      fullPage: true
    }).catch(() => {});

    throw error;
  }
});
