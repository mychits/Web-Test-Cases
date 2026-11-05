
const { test, expect } = require('@playwright/test');
const path = require('path');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add Three Employees and Verify Each Employee', async ({ page }) => {
  test.setTimeout(240000);

  const baseURL =
    'http://purple-development-mychits-admin.s3-website.eu-north-1.amazonaws.com/';

  const dashboardURL = `${baseURL}dashboard`;

  const employeeURL =
    `${baseURL}staff-menu/employee-menu/employee`;

  const employees = [
    {
      name: 'Jack Kiran',
      email: 'jack.kiran.test01@example.com',
      phone: '9876501001',
      password: 'Test@Jack101',
      pincode: '560001',
      aadhaar: '234567890123',
      pan: 'ABCTY1234D',
      address: 'Test Address 101, Bengaluru',
      designation: 'Full Stack Developer',
      status: 'Active',
      joiningDate: '2026-11-01',
      dob: '1995-05-15',
      gender: 'Male',
      salary: '25000',
      alternatePhone: '9876502001',
      leaves: '12',
      emergencyContact: 'Kiran Kumar'
    },
    {
      name: 'Jack Praveen',
      email: 'jack.praveen.test02@example.com',
      phone: '9876501002',
      password: 'Test@Jack102',
      pincode: '560002',
      aadhaar: '345678901234',
      pan: 'BCDTY2345E',
      address: 'Test Address 102, Bengaluru',
      designation: 'Full Stack Developer',
      status: 'Active',
      joiningDate: '2026-11-02',
      dob: '1996-08-20',
      gender: 'Male',
      salary: '28000',
      alternatePhone: '9876502002',
      leaves: '15',
      emergencyContact: 'Praveen Kumar'
    },
    {
      name: 'Jack Rohan',
      email: 'jack.rohan.test03@example.com',
      phone: '9876501003',
      password: 'Test@Jack103',
      pincode: '560003',
      aadhaar: '456789012345',
      pan: 'CDETY3456F',
      address: 'Test Address 103, Bengaluru',
      designation: 'Full Stack Developer',
      status: 'Active',
      joiningDate: '2026-11-03',
      dob: '1997-12-10',
      gender: 'Male',
      salary: '30000',
      alternatePhone: '9876502003',
      leaves: '10',
      emergencyContact: 'Rohan Kumar'
    }
  ];

  let successCount = 0;

  // STEP 1: Open Dashboard
  await page.goto(dashboardURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Dashboard opened:', page.url());

  // STEP 2: Open Employee Page
  await page.goto(employeeURL, {
    waitUntil: 'domcontentloaded',
    timeout: 45000
  });

  console.log('Employee page opened:', page.url());

  // STEP 3: Search Employee in Table
  async function findEmployee(employeeName) {
    const searchBox = page.getByPlaceholder('Search...').first();

    await expect(searchBox).toBeVisible({ timeout: 15000 });

    await searchBox.fill(employeeName);

    await page.waitForTimeout(1000);

    const matchingRow = page.locator('table tbody tr').filter({
      hasText: employeeName
    });

    const found = await matchingRow.count() > 0;

    if (found) {
      console.log(`Employee found: ${employeeName}`);
      return true;
    }

    console.log(`Employee not found: ${employeeName}`);
    return false;
  }

  // STEP 4: Open Add Employee Form
  async function openAddEmployeeForm() {
    const addButton = page.getByRole('button', {
      name: /add employee/i
    });

    await expect(addButton).toBeVisible({ timeout: 15000 });

    await addButton.click();

    await expect(
      page.getByPlaceholder('Enter the Full Name', {
        exact: true
      })
    ).toBeVisible({ timeout: 15000 });

    console.log('Add Employee form opened.');
  }

  // STEP 5: Fill Text Fields
  async function fillField(placeholder, value) {
    const field = page.getByPlaceholder(placeholder, {
      exact: true
    });

    await expect(field).toBeVisible({ timeout: 15000 });
    await expect(field).toBeEnabled({ timeout: 15000 });

    await field.fill(String(value));

    console.log(`Filled: ${placeholder}`);
  }

  // STEP 6: Select Dropdown Values
  async function selectField(labelText, value) {
    const label = page.locator('label').filter({
      hasText: new RegExp(`^${labelText}\\s*\\*?`, 'i')
    }).last();

    await expect(label).toBeVisible({ timeout: 10000 });

    const dropdown = label.locator(
      'xpath=following::*[self::select or @role="combobox" or contains(@class,"select")][1]'
    );

    await expect(dropdown).toBeVisible({ timeout: 10000 });

    const tagName = await dropdown.evaluate(element =>
      element.tagName.toLowerCase()
    );

    if (tagName === 'select') {
      await dropdown.selectOption({ label: value });
    } else {
      await dropdown.click();

      const option = page.getByText(value, {
        exact: true
      }).last();

      await expect(option).toBeVisible({ timeout: 10000 });
      await option.click();
    }

    console.log(`${labelText} selected: ${value}`);
  }

  // STEP 7: Fill Date Fields
  async function fillDateFields(employee) {
    const dateFields = page.locator('input[type="date"]');

    await expect(dateFields).toHaveCount(3, {
      timeout: 10000
    });

    // Joining Date
    await dateFields.nth(0).fill(employee.joiningDate);

    console.log(`Joining Date selected: ${employee.joiningDate}`);

    // Leaving Date is optional, so leave it empty.

    // Date of Birth
    await dateFields.nth(2).fill(employee.dob);

    console.log(`Date of Birth selected: ${employee.dob}`);
  }

  // STEP 8: Fill Allocated Leaves
  async function fillAllocatedLeaves(value) {
    const label = page.locator('label').filter({
      hasText: /^Total Allocated Leaves/i
    }).last();

    await expect(label).toBeVisible({ timeout: 10000 });

    const field = label.locator('xpath=following::input[1]');

    await expect(field).toBeVisible({ timeout: 10000 });

    await field.fill(String(value));

    console.log(`Total Allocated Leaves: ${value}`);
  }

  // STEP 9: Add One Employee
  async function addEmployee(employee) {
    console.log('--------------------------------');
    console.log(`Adding employee: ${employee.name}`);

    // Required text fields
    await fillField('Enter the Full Name', employee.name);
    await fillField('Enter Email', employee.email);
    await fillField('Enter Phone Number', employee.phone);
    await fillField('Enter Password', employee.password);
    await fillField('Enter Pincode', employee.pincode);
    await fillField('Enter Adhaar Number', employee.aadhaar);
    await fillField('Enter Pan Number', employee.pan);
    await fillField('Enter the Address', employee.address);

    // Required dropdown fields
    await selectField('Designation', employee.designation);
    await selectField('Status', employee.status);

    // Required date fields
    await fillDateFields(employee);

    // Required Gender dropdown
    await selectField('Gender', employee.gender);

    // Remaining required fields
    await fillField('Enter Your Salary', employee.salary);

    await fillField(
      'Enter Alternate Phone Number',
      employee.alternatePhone
    );

    await fillAllocatedLeaves(employee.leaves);

    await fillField(
      'Enter Emergency Contact Person Name',
      employee.emergencyContact
    );

    // STEP 10: Save Employee
    const saveButton = page.getByRole('button', {
      name: /^Save Employee$/i
    });

    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeEnabled({ timeout: 15000 });

    await saveButton.click();

    console.log(`Save Employee clicked: ${employee.name}`);

    await page.waitForTimeout(2000);

    // Check whether the form has closed
    const nameField = page.getByPlaceholder(
      'Enter the Full Name',
      { exact: true }
    );

    const formStillOpen = await nameField.isVisible().catch(() => false);

    if (formStillOpen) {
      const errors = await page.locator(
        '.ant-form-item-explain-error, [role="alert"]'
      ).allTextContents();

      throw new Error(
        `Employee save not confirmed: ${employee.name}. ` +
        `Form is still open. Validation errors: ${errors.join(' | ') || 'No visible validation message'}`
      );
    }

    console.log(`Employee form closed: ${employee.name}`);
  }

  // STEP 11: Process Three Employees
  for (const employee of employees) {
    console.log('--------------------------------');
    console.log(`Processing: ${employee.name}`);

    await page.goto(employeeURL, {
      waitUntil: 'domcontentloaded'
    });

    // Check whether employee already exists
    const alreadyExists = await findEmployee(employee.name);

    if (alreadyExists) {
      console.log(`SKIPPED: ${employee.name} already exists.`);
      successCount++;
      continue;
    }

    // Clear table search
    await page.getByPlaceholder('Search...').first().clear();

    // Open Add Employee form
    await openAddEmployeeForm();

    // Fill and save
    await addEmployee(employee);

    // Refresh employee table
    await page.waitForTimeout(1500);

    await page.reload({
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(1500);

    // Verify saved employee
    const isSaved = await findEmployee(employee.name);

    if (!isSaved) {
      throw new Error(
        `Employee "${employee.name}" was not found after saving.`
      );
    }

    successCount++;

    console.log(`SUCCESS: ${employee.name} verified.`);
    console.log(
      `Verified Employees: ${successCount}/${employees.length}`
    );
  }

  // STEP 12: Final Result
  console.log('--------------------------------');

  console.log(
    `FINAL RESULT: ${successCount}/${employees.length} employees verified.`
  );

  expect(successCount).toBe(employees.length);
});
