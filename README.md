# Web Test Cases – Playwright Automation

## Project Overview

This project contains automated web application test cases developed using **Playwright and JavaScript**.

The automation is used to test the functionality of the **MyChits Admin Web Application**, including customer management and customer creation workflows.

## Technologies Used

- JavaScript
- Node.js
- Playwright
- VS Code
- Git and GitHub

## Project Structure

```text
Web-Test-Cases/
├── tests/
│   └── customers/
│       └── customer-creation.spec.js
├── test-data/
│   └── customers.js
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

**1. Clone the repository**

```bash
git clone <your-repository-url>
cd Web-Test-Cases
```

Replace `<your-repository-url>` with your actual GitHub repository URL.

**2. Install dependencies**

```bash
npm install
```

**3. Install Playwright browsers**

```bash
npx playwright install
```

## Environment Configuration

Create a `.env` file in the project root.

```dotenv
BASE_URL=your_application_url
ADMIN_ID=your_test_admin_id
BRANCH_NAME=your_test_branch
OTP=your_test_otp
TEST_CUSTOMER_PASSWORD=your_test_customer_password
```

Update the values with the credentials for your test environment.

**Important:** Never commit your `.env` file or actual credentials to GitHub.

## Running Tests

**Run all tests**

```bash
npx playwright test
```

**Run customer creation tests**

```bash
npx playwright test tests/customers/customer-creation.spec.js
```

**Run tests in headed mode**

```bash
npx playwright test tests/customers/customer-creation.spec.js --headed --workers=1 --reporter=line
```

**Run tests using Playwright UI mode**

```bash
npx playwright test --ui
```

## Test Reports

To open the Playwright HTML report:

```bash
npx playwright show-report
```
# Playwright Automation Run Commands For Leads

## 1. Install Dependencies

```bash
npm install
```

## 2. Install Chromium

```bash
npx playwright install chromium
```

## 3. Run Login Automation

```bash
npx playwright test tests/auth/LoginAutomation.spec.js --project=chromium --headed --workers=1
```

## 4. Run Five Leads Automation

```bash
npx playwright test tests/auth/LeadsAdd.spec.js --project=chromium --headed --workers=1
```

## 5. Run All Automation Tests

```bash
npx playwright test --project=chromium --headed --workers=1
```

## 6. Run Tests Without Opening Browser

```bash
npx playwright test --project=chromium --workers=1
```

## 7. Open Playwright Report

```bash
npx playwright show-report
```

## 8. Run Login Automation in Debug Mode

```bash
npx playwright test tests/auth/LoginAutomation.spec.js --project=chromium --debug
```

## 9.Lead Delete Auomation

```bash
npx playwright test tests/auth/LeadsDelete.spec.js --project=chromium --headed --workers=1
```

The report displays test execution results, passed and failed tests, error details, and available screenshots or traces.

## Customer Creation Test Scenario

The customer creation automation is designed to:

1. Login to the MyChits Admin application.
2. Navigate to Customer Management.
3. Open the Add Customer form.
4. Enter customer basic details.
5. Select Referred Type.
6. Select Payment Frequency.
7. Enter payment information.
8. Save the customer.
9. Repeat the workflow for test customers.
10. Report test execution results.

## Future Improvements

- Add more customer management test cases.
- Implement reusable page object classes.
- Improve test data management.
- Add negative and validation test cases.
- Integrate automated tests with CI/CD pipelines.

## Author

QA Automation Testing Project
