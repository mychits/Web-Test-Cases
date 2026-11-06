# Web Test Cases – Playwright Automation

## Project Overview

This project contains automated web application test cases developed using **Playwright and JavaScript**.

The automation is used to test the functionality of the **MyChits Admin Web Application**, including:

- Admin Login
- Customer Creation and Deletion
- Leads Creation and Deletion
- Agent Creation and Deletion
- Employee Creation and Deletion
- Group Creation and Deletion
- Enrollment Creation and Deletion

The main objective is to automate repetitive testing activities, validate application workflows, and identify functional issues.

## Technologies Used

- JavaScript
- Node.js
- Playwright
- Visual Studio Code
- Git and GitHub

## Project Structure

```text
Web-Test-Cases/
├── tests/
│   ├── auth/
│   │   ├── LoginAutomation.spec.js
│   │   ├── LeadsAdd.spec.js
│   │   ├── LeadsDelete.spec.js
│   │   ├── AgentAdd.spec.js
│   │   ├── AgentDelete.spec.js
│   │   ├── EmployeeAdd.spec.js
│   │   └── EmployeeDelete.spec.js
│   │
│   ├── customers/
│   │   ├── customer-creation.spec.js
│   │   └── customer-deletion.spec.js
│   │
│   ├── groups/
│   │   ├── group-creation.spec.js
│   │   └── group-deletion.spec.js
│   │
│   └── enrollments/
│       ├── enrollment-creation.spec.js
│       └── enrollment-deletion.spec.js
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

## Prerequisites

Install the following software:

- Node.js
- npm
- Visual Studio Code
- Git

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Web-Test-Cases
```

Replace `<your-repository-url>` with your actual GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Install Playwright browsers

```bash
npx playwright install
```

To install Chromium only:

```bash
npx playwright install chromium
```

## Environment Configuration

Create a `.env` file in the project root.

```dotenv
# Application configuration
BASE_URL=your_application_url
ADMIN_ID=your_test_admin_id
BRANCH_NAME=your_test_branch
OTP=your_test_otp

# Customer configuration
TEST_CUSTOMER_PASSWORD=your_test_customer_password

# Enrollment creation configuration
ENROLLMENT_GROUP=karthiga
ENROLLMENT_CUSTOMER=Emp2 Chitxpert | 9898987897
ENROLLMENT_PAYMENT_TYPE=Daily
ENROLLMENT_MONTH=2026-12
ENROLLMENT_REFERRED_TYPE=Self Joining
ENROLLMENT_TICKET=Ticket 7
ENABLE_ENROLLMENT_SUBMIT=false

# Enrollment deletion configuration
DELETE_ENROLLMENT_TICKET=Ticket 7
DELETE_ENROLLMENT_REASON=Others
DELETE_ENROLLMENT_CONFIRM=NO
```

Replace the example values with the test data for your environment.

**Important:**

- Never commit `.env` or real credentials to GitHub.
- Set `ENABLE_ENROLLMENT_SUBMIT=true` only when ready to create an enrollment.
- Set `DELETE_ENROLLMENT_CONFIRM=YES` only when the exact automation-created enrollment has been verified.
- The ticket specified for deletion must belong to the intended test enrollment.

Group creation and deletion tests may require additional environment variables according to their implementation.

---

# Playwright Automation Run Commands

All commands must be executed from the project root directory using the VS Code terminal.

## 1. Admin Login Automation

```bash
npx playwright test tests/auth/LoginAutomation.spec.js --project=chromium --headed --workers=1
```

## 2. Leads Automation

### Create Leads

```bash
npx playwright test tests/auth/LeadsAdd.spec.js --project=chromium --headed --workers=1
```

### Delete Leads

```bash
npx playwright test tests/auth/LeadsDelete.spec.js --project=chromium --headed --workers=1
```

## 3. Agent Automation

### Create Agent

```bash
npx playwright test tests/auth/AgentAdd.spec.js --project=chromium --headed --workers=1
```

### Delete Agent

```bash
npx playwright test tests/auth/AgentDelete.spec.js --project=chromium --headed --workers=1
```

## 4. Employee Automation

### Create Employee

```bash
npx playwright test tests/auth/EmployeeAdd.spec.js --project=chromium --headed --workers=1
```

### Delete Employee

```bash
npx playwright test tests/auth/EmployeeDelete.spec.js --project=chromium --headed --workers=1
```

## 5. Customer Automation

### Create Customers

```bash
npx playwright test tests/customers/customer-creation.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Delete Customers

```bash
npx playwright test tests/customers/customer-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

## 6. Group Automation

### Group Creation

**Test file:** `tests/groups/group-creation.spec.js`

```bash
npx playwright test tests/groups/group-creation.spec.js --project=chromium --headed --workers=1 --reporter=line
```

**Workflow:**

1. Log in to MyChits Admin.
2. Navigate to Group Management.
3. Open the Add Group form.
4. Enter the required group details.
5. Configure the group settings.
6. Submit the group creation form.
7. Check the result of the creation operation.

### Group Deletion

**Test file:** `tests/groups/group-deletion.spec.js`

```bash
npx playwright test tests/groups/group-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

**Workflow:**

1. Log in to MyChits Admin.
2. Navigate to Group Management.
3. Locate the target test group.
4. Open its available action controls.
5. Perform the deletion operation according to the application's confirmation flow.
6. Check whether the group was removed.

**Safety:** Run deletion tests only against groups created for automation testing.

## 7. Enrollment Automation

### Enrollment Creation

**Test file:** `tests/enrollments/enrollment-creation.spec.js`

```bash
npx playwright test tests/enrollments/enrollment-creation.spec.js --project=chromium --headed --workers=1 --reporter=line
```

**Workflow:**

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
11. Click Submit.
12. Check the enrollment creation result.

**Important:** Ticket selection must happen before clicking Verify.

The enrollment creation script uses environment variables to control the group, customer, payment type, asking month, referred type, and ticket number.

Submission is controlled using:

```dotenv
ENABLE_ENROLLMENT_SUBMIT=true
```

Use `false` when actual enrollment submission should be disabled.

### Enrollment Deletion

**Test file:** `tests/enrollments/enrollment-deletion.spec.js`

```bash
npx playwright test tests/enrollments/enrollment-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

**Workflow:**

1. Log in to MyChits Admin.
2. Navigate to Enrollments.
3. Locate the exact automation-created enrollment.
4. Click the three-dot Action menu.
5. Select Remove.
6. Open the Removal Reason dropdown.
7. Select Others or the configured reason.
8. Click the red Remove button.
9. Check whether the target enrollment was removed.

The deletion script identifies the target using:

- Customer Name
- Customer Phone Number
- Enrolled Group
- Ticket Number
- Payment Type
- Chit Asking Month

This helps prevent accidental deletion of unrelated enrollments.

**Deletion configuration:**

```dotenv
DELETE_ENROLLMENT_TICKET=Ticket 7
DELETE_ENROLLMENT_REASON=Others
DELETE_ENROLLMENT_CONFIRM=NO
```

`NO` disables the final deletion click.

After confirming that the target is an automation-created enrollment, change the setting to:

```dotenv
DELETE_ENROLLMENT_CONFIRM=YES
```

Then rerun the deletion test.

---

## 8. Run All Automation Tests

```bash
npx playwright test --project=chromium --headed --workers=1
```

**Warning:** Running all tests may execute creation and deletion tests together. Verify test data, execution order, and deletion configuration before using this command.

## 9. Run Tests Without Opening the Browser

```bash
npx playwright test --project=chromium --workers=1
```

## 10. Run Tests in Playwright UI Mode

```bash
npx playwright test --ui
```

## 11. Run Tests in Debug Mode

```bash
npx playwright test --debug
```

## 12. Validate JavaScript Syntax

### Group Creation

```bash
node --check "tests/groups/group-creation.spec.js"
```

### Group Deletion

```bash
node --check "tests/groups/group-deletion.spec.js"
```

### Enrollment Creation

```bash
node --check "tests/enrollments/enrollment-creation.spec.js"
```

### Enrollment Deletion

```bash
node --check "tests/enrollments/enrollment-deletion.spec.js"
```

---

## Playwright Test Reports

To open the Playwright HTML report:

```bash
npx playwright show-report
```

The report displays test execution results, passed and failed tests, error details, and available screenshots or traces.

## Git Ignore Configuration

The `.gitignore` file prevents unnecessary generated files and sensitive environment configuration from being committed to GitHub.

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

These rules ignore Playwright reports, screenshots, authentication state, dependencies, and environment files. They also exclude all matching image files, including any images that might otherwise be useful to commit.

## Git and GitHub Commands

### Check Git Changes

```bash
git status
```

### Stage README Changes

```bash
git add README.md
```

### Commit README Changes

```bash
git commit -m "Update Playwright automation README for groups and enrollments"
```

### Push Changes to GitHub

```bash
git push
```

### Verify Git Status

```bash
git status
```

---

## Automation Best Practices

- Use a single login session for each automation workflow where practical.
- Keep test data separate from the automation code.
- Use stable Playwright locators.
- Avoid unnecessary fixed waits.
- Validate form fields before submission.
- Select tickets before enrollment verification.
- Delete only known automation-created records.
- Use environment variables for configurable test data.
- Check the result of each creation or deletion operation.
- Keep credentials and authentication state out of GitHub.

## Future Improvements

- Implement reusable Page Object Model classes.
- Improve test data management.
- Add more negative and validation test cases.
- Improve automated cleanup of test records.
- Add reliable test data identification.
- Integrate Playwright automation into CI/CD pipelines.
- Generate automated test execution summaries.

## Author

QA Automation Testing Project

