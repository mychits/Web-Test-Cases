
require('dotenv').config();

const { test, expect } = require('@playwright/test');
const path = require('path');
const employees = require('../../test-data/employee');

test.use({
  storageState: path.resolve(__dirname, '../../auth-state.json')
});

test('Add All Employees and Verify Each Employee in List API', async ({ page }) => {

  test.setTimeout(3600000);

  const employeeURL =
    `${process.env.BASE_URL}staff-menu/employee-menu/employee`;

  const successfulEmployees = [];
  const failedEmployees = [];

  // The first five employees were already submitted successfully.
  // Continue from employee 6 to avoid submitting those five again.
  const START_INDEX = 0;


  const ADD_API =
    '/api/agent/add-addtional-employee-info';

  const LIST_API =
    '/api/agent/get-additional-employee-info';

  // Open Dashboard
  await page.goto(`${process.env.BASE_URL}dashboard`);
  await page.waitForLoadState('domcontentloaded');

  console.log('Dashboard opened successfully.');

  // Open Employee page
  await page.goto(employeeURL);
  await page.waitForLoadState('domcontentloaded');

  await expect(
    page.getByRole('button', { name: /Add Employee/i }).last()
  ).toBeVisible({ timeout: 30000 });

  console.log('Employee page opened successfully.');
  console.log('Total Employees:', employees.length);
  console.log('Starting from employee:', START_INDEX + 1);

  for (let i = START_INDEX; i < employees.length; i++) {

    const employee = employees[i];

    console.log('\n================================');
    console.log(`Employee ${i + 1}/${employees.length}`);
    console.log('Name:', employee.name);
    console.log('================================');

    try {

      // Click Add Employee
      await page
        .getByRole('button', { name: /Add Employee/i })
        .last()
        .click();

      // Wait for employee form
      const nameField = page.getByPlaceholder('Enter the Full Name');

      await expect(nameField).toBeVisible({ timeout: 20000 });

      console.log('Employee form opened.');

      // Fill Basic Details
      await nameField.fill(employee.name);

      await page
        .getByPlaceholder('Enter Email')
        .fill(employee.email);

      await page
        .getByPlaceholder('Enter Phone Number')
        .fill(String(employee.phone));

      await page
        .getByPlaceholder('Enter Password')
        .fill(employee.password);

      await page
        .getByPlaceholder('Enter Pincode')
        .fill(String(employee.pincode));

      await page
        .getByPlaceholder('Enter Adhaar Number')
        .fill(String(employee.aadhaar));

      await page
        .getByPlaceholder('Enter Pan Number')
        .fill(employee.pan);

      await page
        .getByPlaceholder('Enter the Address')
        .fill(employee.address);

      console.log('Basic details filled.');

      // Select Designation
      const designationField = page
        .locator('label')
        .filter({ hasText: /^Designation/i })
        .last()
        .locator('xpath=following::div[contains(@class,"ant-select")][1]');

      await designationField.click();

      await page
        .getByText(employee.designation, { exact: true })
        .last()
        .click();

      console.log('Designation selected:', employee.designation);

      // Select Status
      const statusField = page
        .locator('label')
        .filter({ hasText: /^Status/i })
        .last()
        .locator('xpath=following::div[contains(@class,"ant-select")][1]');

      await statusField.click();

      await page
        .getByText(employee.status, { exact: true })
        .last()
        .click();

      console.log('Status selected:', employee.status);

      // Joining Date
      await page
        .locator('input[type="date"]')
        .nth(0)
        .fill(employee.joiningDate);

      // Date of Birth
      await page
        .locator('input[type="date"]')
        .nth(2)
        .fill(employee.dob);

      console.log('Joining Date and DOB filled.');

      // Select Gender
      const genderField = page
        .locator('label')
        .filter({ hasText: /^Gender/i })
        .last()
        .locator('xpath=following::div[contains(@class,"ant-select")][1]');

      await genderField.click();

      await page
        .getByText(employee.gender, { exact: true })
        .last()
        .click();

      console.log('Gender selected:', employee.gender);

      // Salary
      await page
        .getByPlaceholder('Enter Your Salary')
        .fill(String(employee.salary));

      // Alternate Phone
      await page
        .getByPlaceholder('Enter Alternate Phone Number')
        .fill(String(employee.alternatePhone));

      // Total Allocated Leaves
      await page
        .locator('label')
        .filter({ hasText: /^Total Allocated Leaves/i })
        .last()
        .locator('xpath=following::input[1]')
        .fill(String(employee.totalLeaves));

      // Emergency Contact Person
      await page
        .getByPlaceholder('Enter Emergency Contact Person Name')
        .fill(employee.emergencyContact);

      console.log('All employee details filled.');

      // Wait for Add Employee API response
      const addResponsePromise = page.waitForResponse(
        response =>
          response.url().includes(ADD_API) &&
          response.request().method() === 'POST',
        { timeout: 30000 }
      );

      // Save Employee
      await page
        .getByRole('button', { name: /^Save Employee$/i })
        .click();

      const addResponse = await addResponsePromise;

      let addResult;

      try {
        addResult = await addResponse.json();
      } catch (error) {
        throw new Error('Could not read Add Employee API response.');
      }

      console.log('Add API Status:', addResponse.status());
      console.log('Add API Message:', addResult.message);

      if (!addResponse.ok() || addResult.status !== true) {
        throw new Error(
          addResult.message || 'Employee creation API failed.'
        );
      }

      const employeeCode =
        addResult.employee?.employeeCode;

      console.log('Employee Code:', employeeCode);

      if (!employeeCode) {
        throw new Error(
          'Add API did not return an employee code. Cannot verify this employee.'
        );
      }

      // Wait for the form to close
      await expect(nameField).toBeHidden({ timeout: 20000 });

      console.log('Employee saved. Checking Employee List API...');

      // Check Employee List API up to 3 times
      let employeeFound = false;
      let latestListCount = 0;

      for (let attempt = 1; attempt <= 3; attempt++) {

        console.log(`List API verification attempt: ${attempt}/3`);

        // Reload the page to trigger the actual Employee List API request
        const listResponsePromise = page.waitForResponse(
          response =>
            response.url().includes(LIST_API) &&
            response.request().method() === 'GET',
          { timeout: 30000 }
        );

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const listResponse = await listResponsePromise;

        console.log('List API Status:', listResponse.status());

        if (!listResponse.ok()) {
          throw new Error(
            `Employee List API returned ${listResponse.status()}.`
          );
        }

        const listResult = await listResponse.json();

        const employeeList = Array.isArray(listResult.employee)
          ? listResult.employee
          : [];

        latestListCount = employeeList.length;

        console.log('Employee List Record Count:', latestListCount);

        employeeFound = employeeList.some(
          item => item.employeeCode === employeeCode
        );

        if (employeeFound) {
          break;
        }

        console.log(
          `${employeeCode} is not in the list yet. Waiting before retry...`
        );

        await page.waitForTimeout(3000);
      }

      if (!employeeFound) {

        failedEmployees.push({
          name: employee.name,
          employeeCode: employeeCode,
          reason: 'Add API returned success, but Employee List API did not contain this employee after 3 checks.'
        });

        console.log('EMPLOYEE NOT VERIFIED:', employee.name);
        console.log('Employee Code:', employeeCode);

        console.log(
          'Stopping the test to avoid submitting more employees while the list API is not showing saved records.'
        );

        break;
      }

      successfulEmployees.push({
        name: employee.name,
        employeeCode: employeeCode
      });

      console.log('EMPLOYEE ADDED AND VERIFIED:', employee.name);
      console.log('Verified Employee Code:', employeeCode);

      // Wait for Add Employee button before next employee
      await expect(
        page.getByRole('button', { name: /Add Employee/i }).last()
      ).toBeVisible({ timeout: 30000 });

    } catch (error) {

      failedEmployees.push({
        name: employee.name,
        reason: error.message
      });

      console.log('EMPLOYEE FAILED:', employee.name);
      console.log('ERROR:', error.message);

      // Try to close the form if it is still open
      try {
        const cancelButton = page.getByRole('button', {
          name: /Cancel/i
        }).last();

        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      } catch (closeError) {
        console.log('Could not close the employee form.');
      }

      // Stop rather than risk submitting more employees after an error
      break;
    }
  }

  // Final Summary
  console.log('\n================================');
  console.log('EMPLOYEE ADD SUMMARY');
  console.log('================================');

  console.log('Total Employees in Data:', employees.length);
  console.log('Successfully Added and Verified:', successfulEmployees.length);
  console.log('Failed or Not Verified:', failedEmployees.length);

  console.log('\nSuccessfully Added and Verified Employees:');

  successfulEmployees.forEach((employee, index) => {
    console.log(
      `${index + 1}. ${employee.name} - ${employee.employeeCode}`
    );
  });

  console.log('\nFailed or Not Verified Employees:');

  failedEmployees.forEach((employee, index) => {
    console.log(
      `${index + 1}. ${employee.name} - ${employee.employeeCode || 'No code'} - ${employee.reason}`
    );
  });

  console.log('================================');

  expect(
    failedEmployees,
    'Some employees could not be added and verified. Check the terminal output.'
  ).toHaveLength(0);

});
