
# Web Test Cases – Playwright Automation

## Project Overview

This project contains automated web application test cases developed using **Playwright and JavaScript**.

The automation is designed to test the functionality of the **MyChits Admin Web Application**.

### Modules Covered

- Admin Login
- Leads Creation and Deletion
- Agent Creation and Deletion
- Employee Creation and Deletion
- Customer Creation and Deletion
- Group Creation and Deletion
- Enrollment Creation and Deletion
- Auction Creation and Deletion
- Loan Creation
- Loan Status Update: Requested to Pending
- Loan Status Update: Pending to Reject
- Website-Wide Field Validation

### Objectives

- Automate repetitive manual testing activities.
- Validate application functionality.
- Verify creation and deletion workflows.
- Test loan status transitions.
- Reduce manual testing effort.
- Identify functional issues.
- Improve test consistency.
- Generate Playwright execution reports.

---

## Technologies Used

- JavaScript
- Node.js
- Playwright
- Chromium
- Visual Studio Code
- Git
- GitHub
- dotenv

---

## Project Structure

```text
Web-Test-Cases/
│
├── tests/
│   │
│   ├── auth/
│   │   ├── LoginAutomation.spec.js
│   │   ├── LeadsAdd.spec.js
│   │   ├── LeadsDelete.spec.js
│   │   ├── AgentAdd.spec.js
│   │   ├── AgentDelete.spec.js
│   │   ├── EmployeeAdd.spec.js
│   │   ├── EmployeeDelete.spec.js
│   │   └── LoanAdd.spec.js
│   │
│   ├── customers/
│   │   ├── customer-creation.spec.js
│   │   └── customer-deletion.spec.js
│   │
│   ├── groups/
│   │   ├── group-creation.spec.js
│   │   └── group-deletion.spec.js
│   │
│   ├── enrollments/
│   │   ├── enrollment-creation.spec.js
│   │   └── enrollment-deletion.spec.js
│   │
│   ├── auctions/
│   │   ├── auction-creation.spec.js
│   │   └── auction-deletion.spec.js
│   │
│   ├── loans/
│   │   ├── loan-creation.spec.js
│   │   ├── another-loan-creation.spec.js
│   │   ├── loan-pending.spec.js
│   │   ├── loan-reject.spec.js
│   │   └── loan-status-update.js
│   │
│   ├── customer-creation.spec.js
│   └── login.spec.js
│
├── test-data/
│   └── customers.js
│
├── .env
├── .gitignore
├── playwright.config.js
├── package.json
└── README.md
```

**Note:** `loan-status-update.js` is a reusable helper file, not a standalone Playwright test.

---

## Prerequisites

Install the following software:

1. Node.js
2. npm
3. Visual Studio Code
4. Git

Check the installed versions:

```bash
node -v
npm -v
git --version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Web-Test-Cases
```

Replace `<your-repository-url>` with the actual GitHub repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Playwright Browsers

```bash
npx playwright install
```

To install only Chromium:

```bash
npx playwright install chromium
```

### 4. Verify Playwright Installation

```bash
npx playwright --version
```

### 5. List Available Tests

```bash
npx playwright test --list
```

This command displays all tests recognized by the Playwright configuration.

---

## Environment Configuration

Create a `.env` file in the project root.

The following is an example configuration. Use values appropriate for your test environment.

```dotenv
# Application configuration
BASE_URL=your_application_url
ADMIN_ID=your_test_admin_id
BRANCH_NAME=your_test_branch
OTP=your_test_otp

# Customer configuration
TEST_CUSTOMER_PASSWORD=your_test_customer_password

# Enrollment creation
ENROLLMENT_GROUP=your_test_group
ENROLLMENT_CUSTOMER=your_test_customer
ENROLLMENT_PAYMENT_TYPE=Daily
ENROLLMENT_MONTH=2026-12
ENROLLMENT_REFERRED_TYPE=Self Joining
ENROLLMENT_TICKET=Ticket 7
ENABLE_ENROLLMENT_SUBMIT=false

# Enrollment deletion
DELETE_ENROLLMENT_TICKET=Ticket 7
DELETE_ENROLLMENT_REASON=Others
DELETE_ENROLLMENT_CONFIRM=NO

# Loan configuration
LOAN_CUSTOMER_NAME=Emp2 Chitxpert
LOAN_CUSTOMER_PHONE=9898987897
LOAN_EXPECTED_AMOUNT=10000
LOAN_TARGET_ID=

# Loan creation submission
ENABLE_NEW_LOAN_SUBMIT=false

# Loan status updates
ENABLE_LOAN_STATUS_UPDATE=false
```

Additional environment variables may be required by the individual Group, Auction, Loan Creation, and other test scripts.

### Important Security Instructions

- Never commit `.env` to GitHub.
- Never share real passwords or OTPs.
- Use dedicated test accounts.
- Keep sensitive test data private.
- Enable creation, deletion, or status changes only after verifying the intended target.
- Run tests against the approved testing environment.

---

# Playwright Automation Run Commands

All commands should be executed from the project root directory:

```text
C:\Users\SYS 4\Documents\Web-Test-Cases
```

The commands below use the full relative `tests/` path.

## 1. Admin Login Automation

**Test file:** `tests/auth/LoginAutomation.spec.js`

```bash
npx playwright test "tests/auth/LoginAutomation.spec.js" --project=chromium --headed --workers=1
```

### Workflow

1. Open MyChits Admin.
2. Navigate to the Admin Login page.
3. Select the configured branch.
4. Enter the Admin ID.
5. Request OTP.
6. Enter OTP.
7. Verify login.
8. Open the dashboard.

---

## 2. Leads Automation

### Create Leads

**Test file:** `tests/auth/LeadsAdd.spec.js`

```bash
npx playwright test "tests/auth/LeadsAdd.spec.js" --project=chromium --headed --workers=1
```

### Delete Leads

**Test file:** `tests/auth/LeadsDelete.spec.js`

```bash
npx playwright test "tests/auth/LeadsDelete.spec.js" --project=chromium --headed --workers=1
```

### Purpose

Validate the Leads Management creation and deletion workflows.

---

## 3. Agent Automation

### Create Agents

```bash
npx playwright test "tests/auth/AgentAdd.spec.js" --project=chromium --headed --workers=1
```

### Delete Agents

```bash
npx playwright test "tests/auth/AgentDelete.spec.js" --project=chromium --headed --workers=1
```

### Purpose

Validate Agent Management operations, including creation and deletion.

---

## 4. Employee Automation

### Create Employees

```bash
npx playwright test "tests/auth/EmployeeAdd.spec.js" --project=chromium --headed --workers=1
```

### Delete Employees

```bash
npx playwright test "tests/auth/EmployeeDelete.spec.js" --project=chromium --headed --workers=1
```

### Purpose

Validate Employee Management creation and deletion functionality.

---

## 5. Customer Automation

### Customer Creation

**Test file:** `tests/customers/customer-creation.spec.js`

```bash
npx playwright test "tests/customers/customer-creation.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Log in to MyChits Admin.
2. Open Customer Management.
3. Click Add Customer.
4. Enter customer information.
5. Complete customer settings.
6. Save the customer.
7. Return to Customer Management.
8. Continue with the remaining test customers.
9. Verify the creation results.

### Customer Deletion

**Test file:** `tests/customers/customer-deletion.spec.js`

```bash
npx playwright test "tests/customers/customer-deletion.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

**Safety:** Only delete customers created for automation testing.

---

## 6. Group Automation

### Group Creation

**Test file:** `tests/groups/group-creation.spec.js`

```bash
npx playwright test "tests/groups/group-creation.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Log in to MyChits Admin.
2. Navigate to Group Management.
3. Open Add Group.
4. Enter the required group information.
5. Configure group settings.
6. Configure auction-related settings where required.
7. Submit the form.
8. Check the group creation result.

### Group Deletion

**Test file:** `tests/groups/group-deletion.spec.js`

```bash
npx playwright test "tests/groups/group-deletion.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Open Group Management.
2. Locate the target test group.
3. Open the Actions menu.
4. Select the deletion operation.
5. Complete the confirmation flow.
6. Verify the deletion result.

**Safety:** Delete only groups created for automation testing.

---

## 7. Enrollment Automation

### Enrollment Creation

**Test file:** `tests/enrollments/enrollment-creation.spec.js`

```bash
npx playwright test "tests/enrollments/enrollment-creation.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Log in to MyChits Admin.
2. Navigate to Enrollments.
3. Click Add Enrollment.
4. Select the Group.
5. Select the Customer.
6. Select Payment Type.
7. Enter Chit Asking Month.
8. Select Referred Type.
9. Select the required Ticket.
10. Click Verify.
11. Click Submit when submission is enabled.
12. Check the enrollment creation result.

**Important:** Select the ticket before clicking Verify.

### Submission Control

```dotenv
ENABLE_ENROLLMENT_SUBMIT=false
```

When set to `false`, the automation should not perform the final submission.

Enable actual submission only when appropriate:

```dotenv
ENABLE_ENROLLMENT_SUBMIT=true
```

### Enrollment Deletion

**Test file:** `tests/enrollments/enrollment-deletion.spec.js`

```bash
npx playwright test "tests/enrollments/enrollment-deletion.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Open Enrollments.
2. Locate the exact automation-created enrollment.
3. Open the three-dot Actions menu.
4. Select Remove.
5. Choose the removal reason.
6. Confirm removal when enabled.
7. Verify the deletion result.

### Deletion Configuration

```dotenv
DELETE_ENROLLMENT_TICKET=Ticket 7
DELETE_ENROLLMENT_REASON=Others
DELETE_ENROLLMENT_CONFIRM=NO
```

`NO` disables final deletion.

After verifying the target enrollment:

```dotenv
DELETE_ENROLLMENT_CONFIRM=YES
```

Only use `YES` for the intended automation-created enrollment.

---

## 8. Auction Automation

The Auction module contains separate test files for auction creation and deletion.

### Auction Creation

**Test file:** `tests/auctions/auction-creation.spec.js`

```bash
npx playwright test "tests/auctions/auction-creation.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Purpose

Test the Auction Management creation workflow and validate the result.

### Auction Deletion

**Test file:** `tests/auctions/auction-deletion.spec.js`

```bash
npx playwright test "tests/auctions/auction-deletion.spec.js" --project=chromium --headed --workers=1 --reporter=line
```

### Purpose

Test the deletion workflow for a specifically identified automation-created auction.

### Auction Safety

- Verify the auction before submitting changes.
- Use approved test data.
- Do not delete unrelated auctions.
- Check any confirmation settings implemented by the test scripts.
- Review the test-specific environment variables before execution.

---

## 9. Loan Automation

The Loan module supports loan creation and loan status updates.

### Loan Test Files

| File | Purpose |
|------|---------|
| `loan-creation.spec.js` | Loan creation workflow |
| `another-loan-creation.spec.js` | Create another Requested loan |
| `loan-pending.spec.js` | Requested to Pending |
| `loan-reject.spec.js` | Pending to Reject |
| `loan-status-update.js` | Reusable loan status helper |

### 9.1 Loan Creation

**Test file:** `tests/loans/loan-creation.spec.js`

```bash
npx playwright test "tests/loans/loan-creation.spec.js" --headed --workers=1 --reporter=line
```

### 9.2 Another Requested Loan Creation

**Test file:** `tests/loans/another-loan-creation.spec.js`

```bash
npx playwright test "tests/loans/another-loan-creation.spec.js" --headed --workers=1 --reporter=line
```

### Example Loan Test Data

| Field | Example |
|-------|---------|
| Customer | Emp2 Chitxpert |
| Phone Number | 9898987897 |
| Loan Amount | 10000 |
| Tenure | 100 |
| Service Charges | 100 |
| Documentation Charges | 100 |
| Daily Payment | 100 |
| Initial Status | Requested |

### Loan Creation Workflow

1. Log in to MyChits Admin.
2. Open the Loans page.
3. Open Add Loan.
4. Select the borrower.
5. Enter loan amount.
6. Enter tenure.
7. Enter service charges.
8. Enter documentation charges.
9. Enter daily payment.
10. Select Requested status.
11. Submit the loan when enabled.
12. Check the result in the Requests tab.

### Loan Submission Configuration

```dotenv
ENABLE_NEW_LOAN_SUBMIT=false
```

Use `false` for a non-submitting run.

To permit actual submission:

```dotenv
ENABLE_NEW_LOAN_SUBMIT=true
```

Only enable this after reviewing the borrower and loan details.

---

## 10. Loan Status Update: Requested to Pending

**Test file:** `tests/loans/loan-pending.spec.js`

### Run Command

```bash
npx playwright test "tests/loans/loan-pending.spec.js" --headed --workers=1 --reporter=line
```

### Workflow

1. Log in to MyChits Admin.
2. Navigate to the Loans page.
3. Open the Requests tab.
4. Search for the configured customer phone number.
5. Locate the matching loan.
6. Verify the target loan details.
7. Open the three-dot Actions menu.
8. Select Update Status.
9. Locate the Pending option.
10. Click Pending only when updates are enabled.
11. Verify the loan in the Pending tab.

### Dry Run

```dotenv
ENABLE_LOAN_STATUS_UPDATE=false
```

The automation locates the loan and status option without changing the loan status.

### Actual Update

```dotenv
ENABLE_LOAN_STATUS_UPDATE=true
```

This permits the script to click Pending.

**Important:** Verify that the loan is currently Requested before running this test.

---

## 11. Loan Status Update: Pending to Reject

**Test file:** `tests/loans/loan-reject.spec.js`

### Run Command

```bash
npx playwright test "tests/loans/loan-reject.spec.js" --headed --workers=1 --reporter=line
```

### Workflow

1. Log in to MyChits Admin.
2. Navigate to the Loans page.
3. Open the Pending tab.
4. Search using the configured phone number.
5. Identify the matching loan row.
6. Verify the loan amount when configured.
7. Open the Actions menu.
8. Select Update Status.
9. Locate the Reject option.
10. Click Reject only when updates are enabled.
11. Verify the loan in the Rejected tab.

### Dry Run

```dotenv
ENABLE_LOAN_STATUS_UPDATE=false
```

Expected successful dry-run messages:

```text
Preparing Pending -> Reject
Pending tab selected
Loans table found: table 0
Matching loans found: 1
Update Status menu opened
[DRY RUN] Would change Pending -> Reject
No status has been changed
1 passed
```

These are expected messages, not a guarantee that the current test will pass.

### Actual Rejection

```dotenv
ENABLE_LOAN_STATUS_UPDATE=true
```

This permits the Reject status selection.

**Warning:** Rejecting a loan changes application data. Run only after verifying the correct loan and obtaining authorization.

### Loan Identification

The shared loan helper supports:

- Customer name validation when displayed.
- Phone number matching.
- Optional loan amount verification.
- Optional loan ID verification when visible.
- Protection against multiple matching rows.

The Pending table may show a blank Borrower Name field. In that case, the script can use the phone number and other configured checks.

If multiple loans match, the automation should stop rather than selecting an arbitrary loan.

### Loan Status Update Configuration

```dotenv
LOAN_CUSTOMER_NAME=Emp2 Chitxpert
LOAN_CUSTOMER_PHONE=9898987897
LOAN_EXPECTED_AMOUNT=10000
LOAN_TARGET_ID=
ENABLE_LOAN_STATUS_UPDATE=false
```

### Reusable Helper

**File:** `tests/loans/loan-status-update.js`

Functions:

- `validateConfig()`
- `login(page)`
- `openLoans(page)`
- `changeStatus(page, source, target)`

This helper is imported by the Pending and Reject test files.

Do not run `loan-status-update.js` directly as a Playwright test.

---

## 12. Website-Wide Field Validation

**Test file:** `tests/login.spec.js`

```bash
npx playwright test "tests/login.spec.js" --headed --workers=1 --reporter=line
```

This test is intended for login and website-wide field-length auditing.

---

# General Playwright Commands

## Run All Tests

```bash
npx playwright test --project=chromium --headed --workers=1
```

**Warning:** Running all tests can trigger creation, deletion, and status update workflows. Review all environment flags, test data, and dependencies first.

## Run Tests Without Opening the Browser

```bash
npx playwright test --project=chromium --workers=1
```

## Run in UI Mode

```bash
npx playwright test --ui
```

## Run in Debug Mode

```bash
npx playwright test --debug
```

## List All Tests

```bash
npx playwright test --list
```

## Run a Specific Test

```bash
npx playwright test "tests/loans/loan-reject.spec.js" --headed --workers=1 --reporter=line
```

### Important Path Note

If Playwright reports:

```text
Error: No tests found.
```

Check the actual file path and the Playwright configuration.

In this project, the full relative path can be used:

```text
tests/loans/loan-reject.spec.js
```

---

## Validate JavaScript Syntax

### Group Tests

```bash
node --check "tests/groups/group-creation.spec.js"
node --check "tests/groups/group-deletion.spec.js"
```

### Enrollment Tests

```bash
node --check "tests/enrollments/enrollment-creation.spec.js"
node --check "tests/enrollments/enrollment-deletion.spec.js"
```

### Auction Tests

```bash
node --check "tests/auctions/auction-creation.spec.js"
node --check "tests/auctions/auction-deletion.spec.js"
```

### Loan Tests

```bash
node --check "tests/loans/loan-creation.spec.js"
node --check "tests/loans/another-loan-creation.spec.js"
node --check "tests/loans/loan-pending.spec.js"
node --check "tests/loans/loan-reject.spec.js"
node --check "tests/loans/loan-status-update.js"
```

---

## Playwright Test Reports

To open the Playwright HTML report:

```bash
npx playwright show-report
```

Playwright reports can contain:

- Passed tests
- Failed tests
- Error messages
- Screenshots
- Traces when configured
- Execution details

### Test Results Directory

```text
test-results/
```

### HTML Report Directory

```text
playwright-report/
```

---

## Git Ignore Configuration

The `.gitignore` file should exclude sensitive and generated files.

Example:

```gitignore
node_modules/

.env
.env.*
!.env.example

test-results/
playwright-report/
blob-report/

*.png
*.jpg
*.jpeg
*.webp
*.webm
*.trace

auth-state.json
playwright/.auth/

*.log
```

**Note:** These image ignore patterns also exclude screenshots or images that you might intentionally want to track. Adjust them if necessary.

---

## Git and GitHub Commands

### Check Repository Status

```bash
git status
```

### Stage README Changes

```bash
git add README.md
```

### Commit README Changes

```bash
git commit -m "Update README with auction and loan automation"
```

### Push to GitHub

```bash
git push
```

### Verify Git Status

```bash
git status
```

### Stage All Project Changes

Use only when you have reviewed the files being committed:

```bash
git add .
```

### Commit Automation Changes

# Loan Add
npx playwright test tests/auth/LoanAdd.spec.js --project=chromium --headed --workers=1

# Guarantor Add
npx playwright test tests/auth/GuarantorAdd.spec.js --project=chromium --headed --workers=1

# Guarantor Delete
npx playwright test tests/auth/GuarantorDelete.spec.js --project=chromium --headed --workers=1  

### 13/11/2026 – Playwright Automation Commands

**1. Linked Guarantor Add**
```bash
npx playwright test tests/auth/LinkedGuarantorAdd.spec.js --project=chromium --headed --workers=1
```

**2. Co-Applicant Add**
```bash
npx playwright test tests/auth/Co-ApplicantAdd.spec.js --project=chromium --headed --workers=1
```

**3. Co-Applicant Delete**
```bash
npx playwright test tests/auth/Co-ApplicantDelete.spec.js --project=chromium --headed --workers=1
```

**4. Group Category Add**
```bash
npx playwright test tests/auth/GroupCategoryAdd.spec.js --project=chromium --headed --workers=1
```



The report displays test execution results, passed and failed tests, error details, and available screenshots or traces.

### Push Automation Changes

```bash
git push
```

---

## Automation Safety Guidelines

1. Run automation only in an authorized environment.
2. Use dedicated test data.
3. Keep credentials outside source code.
4. Avoid hardcoded OTPs and passwords.
5. Validate the target record before deletion or status updates.
6. Use dry-run flags where supported.
7. Stop if multiple records match the search criteria.
8. Check the results after submission.
9. Avoid unnecessary fixed delays.
10. Prefer stable Playwright locators.
11. Keep tests independent where possible.
12. Do not run dependent status transitions out of order.

---

## Troubleshooting

### 1. No Tests Found

**Error:**

```text
Error: No tests found.
```

**Solution:**

```bash
npx playwright test --list
```

Use the correct test file path and check `playwright.config.js`.

### 2. Terminal Shows a Blank Screen

If the VS Code PowerShell terminal is blank:

1. Close the blank terminal.
2. Open the Command Palette.
3. Select `Terminal: Select Default Profile`.
4. Choose Command Prompt.
5. Open a new terminal.

Test with:

```cmd
echo Hello
```

### 3. Loan Table Not Found

The Requests and Pending tables may use different column names.

Supported name columns:

- Customer Name
- Borrower Name

Supported action columns:

- Action
- Actions

### 4. Matching Loans Found: 0

Possible causes:

- Incorrect phone number.
- Loan is in another status tab.
- Search results have not loaded.
- Customer name is blank in the table.
- The target loan is not present.

Verify the loan using the application interface before changing status.

### 5. Multiple Matching Loans

If multiple loans share the same phone number, the automation should stop.

Use additional identification data to select the intended loan safely.

### 6. Action Menu Not Found

The application may use different controls in different status tabs.

Inspect the Actions cell and update the selector based on the actual HTML.

### 7. Status Update Not Performed

Check:

```dotenv
ENABLE_LOAN_STATUS_UPDATE=false
```

When set to `false`, the script runs in dry-run mode.

Do not change it to `true` until the correct loan and transition have been verified.

---

## Automation Best Practices

- Use reusable helper functions.
- Maintain consistent naming conventions.
- Keep test data separate from test logic.
- Use environment variables for configuration.
- Prefer explicit assertions.
- Avoid unnecessary browser reloads.
- Use a single login session per workflow when practical.
- Run dependent tests in the correct order.
- Maintain clear console logs.
- Capture failure screenshots.
- Review test reports regularly.
- Commit only reviewed source code.

---

## Future Improvements

- Implement Page Object Model classes.
- Improve reusable test fixtures.
- Add negative test cases.
- Improve test data isolation.
- Add unique identifiers for test records.
- Improve automated cleanup.
- Add CI/CD integration.
- Generate test execution summaries.
- Improve loan status verification.
- Add more functional validation scenarios.

---

## Author

**QA Automation Testing Project**

MyChits Admin Web Application

Developed using Playwright and JavaScript.
