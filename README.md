# Web Test Cases – Playwright Automation

## Project Overview

This project contains automated web application test cases developed using **Playwright and JavaScript** for the **MyChits Admin Web Application**.

The project is designed to automate functional testing, validate form inputs, verify record creation and deletion, test status transitions, and identify potential application defects.

### Modules Covered

- Admin Login
- Branch Management
- Leads Creation and Deletion
- Agent Creation and Deletion
- Employee Creation and Deletion
- Customer Creation, Deletion, and Field Validation
- Group Creation and Deletion
- Enrollment Creation and Deletion
- Auction Creation and Deletion
- Loan Creation and Status Updates
- Guarantor Creation and Deletion
- Linked Guarantor Creation
- Co-Applicant Creation and Deletion
- Group Category Creation
- Bid Request Management
- Visitor Management
- Pigmy Management
- Website-Wide Field Validation

### Objectives

- Automate repetitive manual testing activities.
- Validate application functionality.
- Verify creation and deletion workflows.
- Test positive and negative scenarios.
- Validate loan status transitions.
- Support individual and bulk customer testing.
- Identify potential application bugs.
- Reduce manual testing effort.
- Improve test consistency.
- Generate Playwright execution reports.
- Produce structured terminal summaries.

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
│   │   ├── BranchAdd.spec.js
│   │   ├── BranchDelete.spec.js
│   │   ├── LeadsAdd.spec.js
│   │   ├── LeadsDelete.spec.js
│   │   ├── AgentAdd.spec.js
│   │   ├── AgentDelete.spec.js
│   │   ├── EmployeeAdd.spec.js
│   │   ├── EmployeeDelete.spec.js
│   │   ├── LoanAdd.spec.js
│   │   ├── GuarantorAdd.spec.js
│   │   ├── GuarantorDelete.spec.js
│   │   ├── LinkedGuarantorAdd.spec.js
│   │   ├── Co-ApplicantAdd.spec.js
│   │   ├── Co-ApplicantDelete.spec.js
│   │   ├── GroupCategoryAdd.spec.js
│   │   ├── BidRequestAdd.spec.js
│   │   ├── BidRequestAccept.spec.js
│   │   ├── BidRequestPrized.spec.js
│   │   └── BidRequestDelete.spec.js
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
│   ├── visitors/
│   │   └── <visitor-test-file>.spec.js
│   │
│   ├── pigmy/
│   │   └── <pigmy-test-file>.spec.js
│   │
│   ├── customer-creation.spec.js
│   └── login.spec.js
│
├── test-data/
│   ├── customers.js
│   └── customer-data-100.js
│
├── customer-creation-results/
│
├── .env
├── .gitignore
├── playwright.config.js
├── package.json
└── README.md
```

**Important:** BranchAdd, BranchDelete, Visitor, and Pigmy filenames are illustrative and must be replaced with the actual filenames in the repository. The structure above combines the original documented files with proposed additions.

`loan-status-update.js` is a reusable helper, not a standalone Playwright test.

---

## Prerequisites

Install Node.js, npm, Visual Studio Code, and Git.

Check installed versions:

```cmd
node -v
npm -v
git --version
```

---

## Installation

### 1. Clone the Repository

```cmd
git clone <your-repository-url>
cd Web-Test-Cases
```

Replace `<your-repository-url>` with the actual GitHub repository URL.

### 2. Install Dependencies

```cmd
npm install
```

### 3. Install Playwright Browsers

```cmd
npx playwright install
```

To install Chromium only:

```cmd
npx playwright install chromium
```

### 4. Verify Playwright Installation

```cmd
npx playwright --version
```

### 5. List Available Tests

```cmd
npx playwright test --list
```

---

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
LOAN_CUSTOMER_NAME=your_test_customer
LOAN_CUSTOMER_PHONE=your_test_phone
LOAN_EXPECTED_AMOUNT=10000
LOAN_TARGET_ID=

# Loan creation submission
ENABLE_NEW_LOAN_SUBMIT=false

# Loan status updates
ENABLE_LOAN_STATUS_UPDATE=false
```

Additional environment variables may be required by individual Group, Auction, Branch, Visitor, Pigmy, and other test scripts.

### Security Instructions

- Never commit `.env` to GitHub.
- Never share real passwords or OTPs.
- Use dedicated test accounts.
- Keep sensitive test data private.
- Enable deletion or status changes only after verifying the intended target.
- Run tests against an approved testing environment.

---

# Playwright Automation Run Commands

Execute commands from the project root:

```text
C:\Users\SYS 4\Documents\Web-Test-Cases
```

The following commands are suitable for Windows Command Prompt.

---

## 1. Admin Login Automation

**Test file:** `tests/auth/LoginAutomation.spec.js`

```cmd
npx playwright test tests/auth/LoginAutomation.spec.js --project=chromium --headed --workers=1
```

### Workflow

1. Open MyChits Admin.
2. Navigate to Admin Login.
3. Select the configured branch.
4. Enter the Admin ID.
5. Request OTP.
6. Enter OTP.
7. Verify login.
8. Open the dashboard.

---

## 2. Branch Management Automation

### Overview

Branch Management automation validates branch creation, branch details, required fields, and branch management operations.

### Test Scenarios

- Branch creation with valid data.
- Branch Name validation.
- Required field validation.
- Minimum and maximum field-length validation.
- Duplicate branch validation.
- Branch search and listing.
- Branch information updates, where supported.
- Branch activation and deactivation, where supported.
- Branch deletion, where supported.
- Error message validation.

### Branch Creation Workflow

1. Log in to MyChits Admin.
2. Navigate to Branches Management.
3. Click Create Branch.
4. Enter the required branch details.
5. Verify mandatory fields.
6. Submit the form.
7. Verify the success or error message.
8. Confirm the created branch appears in the branch list.

### Branch Validation Scenarios

| Field | Test Data | Expected Result |
|---|---|---|
| Branch Name | `Main Branch` | Accept valid name |
| Branch Name | `12345` | Reject if numeric-only names are prohibited |
| Branch Name | Empty | Show required-field validation |
| Branch Name | Special characters only | Reject if prohibited |
| Branch Name | Excessively long text | Enforce configured maximum length |
| Branch Name | Existing name | Apply duplicate-name rules |

### Branch Creation

**Example test file:** `tests/auth/BranchAdd.spec.js`

```cmd
npx playwright test tests/auth/BranchAdd.spec.js --project=chromium --headed --workers=1
```

### Branch Deletion

**Example test file:** `tests/auth/BranchDelete.spec.js`

```cmd
npx playwright test tests/auth/BranchDelete.spec.js --project=chromium --headed --workers=1
```

**Note:** These are example filenames. Use the actual Branch test paths in your project.

### Expected Results

- Valid branch details should be accepted.
- Invalid values should be rejected according to approved requirements.
- Required fields should display validation messages.
- Duplicate branches should be handled correctly.
- Successfully created branches should appear in the branch list.

**Safety:** Only create, update, or delete branches in an authorized testing environment.

---

## 3. Leads Automation

### Create Leads

```cmd
npx playwright test tests/auth/LeadsAdd.spec.js --project=chromium --headed --workers=1
```

### Delete Leads

```cmd
npx playwright test tests/auth/LeadsDelete.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate Leads Management creation and deletion workflows.

---

## 4. Agent Automation

### Create Agents

```cmd
npx playwright test tests/auth/AgentAdd.spec.js --project=chromium --headed --workers=1
```

### Delete Agents

```cmd
npx playwright test tests/auth/AgentDelete.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate Agent Management creation and deletion functionality.

---

## 5. Employee Automation

### Create Employees

```cmd
npx playwright test tests/auth/EmployeeAdd.spec.js --project=chromium --headed --workers=1
```

### Delete Employees

```cmd
npx playwright test tests/auth/EmployeeDelete.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate Employee Management creation and deletion functionality.

---

## 6. Customer Automation

### Overview

Customer Management automation validates customer creation, deletion, and field-level input validation.

The customer creation workflow is designed to support a dataset containing up to 100 customer records.

### Test Files

| File | Purpose |
|---|---|
| `tests/customers/customer-creation.spec.js` | Customer creation and validation |
| `tests/customers/customer-deletion.spec.js` | Customer deletion |
| `test-data/customer-data-100.js` | Customer test data |

### Customer Creation Workflow

1. Log in to MyChits Admin.
2. Open Customer Management.
3. Click Add Customer.
4. Enter Basic Details.
5. Enter Address Details.
6. Select Country, State, and District.
7. Select Referred Type.
8. Select Payment Frequency.
9. Enter Installment Amount.
10. Save and confirm the customer when appropriate.
11. Verify the application result.
12. Return to Customer Management.
13. Continue with the remaining selected customers.

### Customer Dataset

**File:** `test-data/customer-data-100.js`

Customer data fields include:

- Test ID
- Customer Name
- First Name
- Middle Name
- Last Name
- Email
- Phone Number
- Aadhaar Number
- PAN Number
- Pincode
- Address
- Communication Address
- Permanent Address
- Country
- State
- District
- Family Code
- Referred Type
- Payment Frequency
- Installment Amount

### Run One Customer

Example: Customer 1.

```cmd
set CUSTOMER_MODE=ONE
set CUSTOMER_NUMBER=1
npx playwright test tests/customers/customer-creation.spec.js --project=chromium --headed --workers=1 --retries=0
```

### Run Customer 50

```cmd
set CUSTOMER_MODE=ONE
set CUSTOMER_NUMBER=50
npx playwright test tests/customers/customer-creation.spec.js --project=chromium --headed --workers=1 --retries=0
```

### Run All 100 Customers

```cmd
set CUSTOMER_MODE=ALL
npx playwright test tests/customers/customer-creation.spec.js --project=chromium --headed --workers=1 --retries=0
```

### Run a Customer Range

Example: Customers 1 to 10.

```cmd
set CUSTOMER_MODE=RANGE
set CUSTOMER_START=1
set CUSTOMER_END=10
npx playwright test tests/customers/customer-creation.spec.js --project=chromium --headed --workers=1 --retries=0
```

### Customer Field Validation

The intended data-driven workflow allows QA engineers to change customer values in the dataset without creating a separate Playwright script for each invalid scenario.

Example valid data:

```javascript
{
  testId: "TC001",
  name: "Arun Kumar",
  firstName: "Arun",
  lastName: "Kumar"
}
```

Example invalid data:

```javascript
{
  testId: "TC001",
  name: "12345 Kumar",
  firstName: "12345",
  lastName: "Kumar"
}
```

The remaining required fields must also be included in each record.

### Validation Scenarios

| Field | Invalid Test Value | Expected Result |
|---|---|---|
| First Name | `12345` | Reject numeric-only name |
| Last Name | `67890` | Reject numeric-only name |
| Email | `invalidemail` | Reject invalid email |
| Phone Number | `123` | Reject invalid phone |
| Pincode | `ABCDEF` | Reject invalid pincode |
| Aadhaar | `12345` | Reject invalid format |
| PAN | `123456` | Reject invalid format |
| Installment Amount | `-100` | Reject negative amount if prohibited |

The expected validation behavior must match the approved application requirements.

### Automatic Data Validation Requirement

The target workflow is:

1. Update customer data in `customer-data-100.js`.
2. Run the same Playwright command.
3. Automatically identify fields that violate expected validation rules.
4. Observe whether the application accepts or rejects the data.
5. Assign the appropriate QA result.

**Implementation status:** The previously shared script still uses `CUSTOMER_TEST_TYPE`, `INVALID_FIELD`, and `INVALID_VALUE` for explicit negative testing. Automatic validation using only changed dataset values requires the corresponding Playwright code changes and verification.

### QA Status Classification

| Status | Meaning |
|---|---|
| PASS | Application behaves according to requirements |
| BUG | Application violates a confirmed requirement |
| NEEDS_REVIEW | Result is unclear and requires investigation |
| ERROR | Automation or application execution error |

### Terminal Summary

Expected summary format:

```text
========== FINAL SUMMARY ==========
Total: 1
Passed: 1
Potential Bugs: 0
Needs Review: 0
Errors: 0
```

Example when a potential bug is detected:

```text
========== FINAL SUMMARY ==========
Total: 1
Passed: 0
Potential Bugs: 1
Needs Review: 0
Errors: 0
```

These are illustrative results, not actual test executions.

A correctly rejected invalid value should count as PASS.

A potential bug should be reported only when the unexpected application behavior is verified.

### Customer Bug Report

Recommended report columns:

| Column | Description |
|---|---|
| Module | Customer Management |
| Page | Add Customer |
| Field | Field under validation |
| Test ID | Dataset identifier |
| Test Value | Input entered |
| Expected Result | Required application behavior |
| Actual Result | Observed application behavior |
| Status | PASS, BUG, NEEDS_REVIEW, or ERROR |

### Customer Test Results

The automation can generate reports in:

```text
customer-creation-results/
├── customer-test-results.json
├── customer-bug-report.csv
└── failure-screenshots/
```

Actual output files depend on the implemented script.

### Customer Deletion

```cmd
npx playwright test tests/customers/customer-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

**Safety:** Delete only customers created for automation testing.

---

## 7. Group Automation

### Group Creation

```cmd
npx playwright test tests/groups/group-creation.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Log in to MyChits Admin.
2. Navigate to Group Management.
3. Open Add Group.
4. Enter the required group information.
5. Configure group settings.
6. Configure auction-related settings where required.
7. Submit the form.
8. Verify the result.

### Group Deletion

```cmd
npx playwright test tests/groups/group-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Open Group Management.
2. Locate the target group.
3. Open the Actions menu.
4. Select the deletion operation.
5. Complete confirmation.
6. Verify deletion.

**Safety:** Delete only automation-created test groups.

---

## 8. Enrollment Automation

### Enrollment Creation

```cmd
npx playwright test tests/enrollments/enrollment-creation.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Workflow

1. Log in.
2. Open Enrollments.
3. Select Add Enrollment.
4. Select Group and Customer.
5. Select Payment Type.
6. Enter Chit Asking Month.
7. Select Referred Type.
8. Select the required Ticket.
9. Click Verify.
10. Submit when enabled.
11. Verify the result.

**Important:** Select the ticket before clicking Verify.

### Submission Control

```dotenv
ENABLE_ENROLLMENT_SUBMIT=false
```

Set to `true` only when actual submission is intended and authorized.

### Enrollment Deletion

```cmd
npx playwright test tests/enrollments/enrollment-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Deletion Configuration

```dotenv
DELETE_ENROLLMENT_TICKET=Ticket 7
DELETE_ENROLLMENT_REASON=Others
DELETE_ENROLLMENT_CONFIRM=NO
```

`NO` disables final deletion.

After verifying the exact target:

```dotenv
DELETE_ENROLLMENT_CONFIRM=YES
```

---

## 9. Auction Automation

### Auction Creation

```cmd
npx playwright test tests/auctions/auction-creation.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Auction Deletion

```cmd
npx playwright test tests/auctions/auction-deletion.spec.js --project=chromium --headed --workers=1 --reporter=line
```

### Purpose

Validate Auction Management creation and deletion workflows.

### Safety

- Verify auction details before submission.
- Use approved test data.
- Do not delete unrelated auctions.
- Review test-specific confirmation settings.

---

## 10. Loan Automation

### Loan Test Files

| File | Purpose |
|---|---|
| `loan-creation.spec.js` | Loan creation |
| `another-loan-creation.spec.js` | Another Requested loan |
| `loan-pending.spec.js` | Requested to Pending |
| `loan-reject.spec.js` | Pending to Reject |
| `loan-status-update.js` | Reusable helper |

### Loan Creation

```cmd
npx playwright test tests/loans/loan-creation.spec.js --headed --workers=1 --reporter=line
```

### Another Requested Loan

```cmd
npx playwright test tests/loans/another-loan-creation.spec.js --headed --workers=1 --reporter=line
```

### Example Loan Test Data

| Field | Example |
|---|---|
| Customer | Emp2 Chitxpert |
| Phone | 9898987897 |
| Loan Amount | 10000 |
| Tenure | 100 |
| Service Charges | 100 |
| Documentation Charges | 100 |
| Daily Payment | 100 |
| Initial Status | Requested |

### Loan Creation Workflow

1. Log in.
2. Open Loans.
3. Open Add Loan.
4. Select borrower.
5. Enter loan amount and tenure.
6. Enter service charges.
7. Enter documentation charges.
8. Enter daily payment.
9. Select Requested status.
10. Submit when enabled.
11. Verify the result in Requests.

### Submission Control

```dotenv
ENABLE_NEW_LOAN_SUBMIT=false
```

Set to `true` only after verifying the intended borrower and loan details.

---

## 11. Loan Status Update: Requested to Pending

```cmd
npx playwright test tests/loans/loan-pending.spec.js --headed --workers=1 --reporter=line
```

### Workflow

1. Open Loans.
2. Select Requests.
3. Search for the configured phone number.
4. Locate the matching loan.
5. Verify loan details.
6. Open Actions.
7. Select Update Status.
8. Select Pending when enabled.
9. Verify the loan in Pending.

### Dry Run

```dotenv
ENABLE_LOAN_STATUS_UPDATE=false
```

### Actual Update

```dotenv
ENABLE_LOAN_STATUS_UPDATE=true
```

Only enable the update after verifying the loan.

---

## 12. Loan Status Update: Pending to Reject

```cmd
npx playwright test tests/loans/loan-reject.spec.js --headed --workers=1 --reporter=line
```

### Workflow

1. Open Loans.
2. Select Pending.
3. Search using the configured phone number.
4. Identify the matching loan.
5. Verify the loan amount and other identifiers.
6. Open Actions.
7. Select Update Status.
8. Select Reject when enabled.
9. Verify the loan in Rejected.

### Dry Run

```dotenv
ENABLE_LOAN_STATUS_UPDATE=false
```

### Actual Rejection

```dotenv
ENABLE_LOAN_STATUS_UPDATE=true
```

### Loan Identification

The documented helper supports:

- Customer name validation when displayed.
- Phone number matching.
- Optional loan amount verification.
- Optional loan ID verification.
- Protection against multiple matching rows.

The Pending table may show a blank Borrower Name. Use the configured phone number and other identifiers to verify the correct loan.

### Reusable Helper

**File:** `tests/loans/loan-status-update.js`

Documented functions:

- `validateConfig()`
- `login(page)`
- `openLoans(page)`
- `changeStatus(page, source, target)`

Do not run this helper directly as a Playwright test.

---

## 13. Website-Wide Field Validation

**Test file:** `tests/login.spec.js`

```cmd
npx playwright test tests/login.spec.js --headed --workers=1 --reporter=line
```

This test is intended for login and website-wide field-length auditing.

---

## 14. Guarantor Automation

### Guarantor Add

```cmd
npx playwright test tests/auth/GuarantorAdd.spec.js --project=chromium --headed --workers=1
```

### Guarantor Delete

```cmd
npx playwright test tests/auth/GuarantorDelete.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate guarantor creation and deletion workflows.

---

## 15. Linked Guarantor Automation

### Linked Guarantor Add

```cmd
npx playwright test tests/auth/LinkedGuarantorAdd.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate linked guarantor creation and association workflows.

---

## 16. Co-Applicant Automation

### Co-Applicant Add

```cmd
npx playwright test tests/auth/Co-ApplicantAdd.spec.js --project=chromium --headed --workers=1
```

### Co-Applicant Delete

```cmd
npx playwright test tests/auth/Co-ApplicantDelete.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate Co-Applicant Management creation and deletion workflows.

---

## 17. Group Category Automation

### Group Category Add

```cmd
npx playwright test tests/auth/GroupCategoryAdd.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate Group Category creation.

---

## 18. Bid Management Automation

### Bid Request Add

```cmd
npx playwright test tests/auth/BidRequestAdd.spec.js --project=chromium --headed --workers=1
```

### Bid Request Accept

```cmd
npx playwright test tests/auth/BidRequestAccept.spec.js --project=chromium --headed --workers=1
```

### Bid Request Prized

```cmd
npx playwright test tests/auth/BidRequestPrized.spec.js --project=chromium --headed --workers=1
```

### Bid Request Delete

```cmd
npx playwright test tests/auth/BidRequestDelete.spec.js --project=chromium --headed --workers=1
```

### Purpose

Validate Bid Request Management creation, acceptance, prized processing, and deletion.

---

## 19. Visitor Management Automation

### Overview

Visitor Management automation is intended to validate visitor registration and management workflows in the MyChits Admin Web Application.

### Test Scenarios

- Visitor creation.
- Visitor details validation.
- Required field validation.
- Visitor search and listing.
- Visitor information updates, where supported.
- Visitor deletion, where supported.
- Error message validation.

### Test Execution

Run the Visitor Management test using its actual file path:

```cmd
npx playwright test "tests/visitors/<visitor-test-file>.spec.js" --project=chromium --headed --workers=1
```

Replace `<visitor-test-file>` with the actual Visitor test filename.

### Expected Results

- Valid visitor details should be accepted.
- Invalid visitor details should be rejected according to approved application requirements.
- Successfully created visitors should appear in the visitor list.
- Search, update, and deletion operations should work where supported.
- Unexpected application behavior should be reported for review.

---

## 20. Pigmy Management Automation

### Overview

Pigmy Management automation is intended to validate recurring small-value deposit collection and related management workflows in the MyChits Admin Web Application.

### Test Scenarios

- Pigmy account or record creation.
- Customer selection and validation.
- Deposit amount validation.
- Collection entry validation.
- Payment frequency validation, where applicable.
- Pigmy transaction listing and search.
- Required field validation.
- Error message validation.

### Test Execution

Run the Pigmy Management test using its actual file path:

```cmd
npx playwright test "tests/pigmy/<pigmy-test-file>.spec.js" --project=chromium --headed --workers=1
```

Replace `<pigmy-test-file>` with the actual Pigmy test filename.

### Expected Results

- Valid Pigmy details should be accepted.
- Invalid deposit amounts should be rejected according to approved application requirements.
- Customer selection should work correctly.
- Successful transactions should appear in the appropriate list.
- Validation and submission errors should be clearly reported.

---

# General Playwright Commands

## Run All Tests

```cmd
npx playwright test --project=chromium --headed --workers=1
```

**Warning:** Running all tests can trigger creation, deletion, and status update workflows. Review environment flags and test data first.

## Run Without Opening the Browser

```cmd
npx playwright test --project=chromium --workers=1
```

## Run in UI Mode

```cmd
npx playwright test --ui
```

## Run in Debug Mode

```cmd
npx playwright test --debug
```

## List Available Tests

```cmd
npx playwright test --list
```

## Run a Specific Test

```cmd
npx playwright test tests/loans/loan-reject.spec.js --headed --workers=1 --reporter=line
```

---

# Validate JavaScript Syntax

### Customer Tests

```cmd
node --check tests/customers/customer-creation.spec.js
node --check tests/customers/customer-deletion.spec.js
node --check test-data/customer-data-100.js
```

### Group Tests

```cmd
node --check tests/groups/group-creation.spec.js
node --check tests/groups/group-deletion.spec.js
```

### Enrollment Tests

```cmd
node --check tests/enrollments/enrollment-creation.spec.js
node --check tests/enrollments/enrollment-deletion.spec.js
```

### Auction Tests

```cmd
node --check tests/auctions/auction-creation.spec.js
node --check tests/auctions/auction-deletion.spec.js
```

### Loan Tests

```cmd
node --check tests/loans/loan-creation.spec.js
node --check tests/loans/another-loan-creation.spec.js
node --check tests/loans/loan-pending.spec.js
node --check tests/loans/loan-reject.spec.js
node --check tests/loans/loan-status-update.js
```

### Branch, Visitor, and Pigmy Tests

Run `node --check` with the actual test filenames after confirming their paths.

---

# Playwright Test Reports

Open the HTML report:

```cmd
npx playwright show-report
```

Playwright reports can include:

- Passed and failed tests
- Error messages
- Screenshots
- Traces
- Execution details

### Standard Output Directories

```text
test-results/
playwright-report/
```

### Customer-Specific Reports

```text
customer-creation-results/
```

---

# Git Ignore Configuration

Recommended `.gitignore` entries:

```gitignore
node_modules/

.env
.env.*
!.env.example

test-results/
playwright-report/
blob-report/
customer-creation-results/

*.png
*.jpg
*.jpeg
*.webp
*.webm
*.trace
*.log

auth-state.json
playwright/.auth/
```

Adjust image patterns if the repository intentionally tracks image assets.

---

# Git and GitHub Commands

## Check Repository Status

```cmd
git status
```

## Stage README Changes

```cmd
git add README.md
```

## Commit README Changes

```cmd
git commit -m "Update README with branch, visitor, pigmy and customer automation"
```

## Push to GitHub

```cmd
git push
```

## Verify Status

```cmd
git status
```

## Stage All Reviewed Changes

```cmd
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
 ## Automation Testing Commands For Bid Management

# 1. Bid Request Add
npx playwright test tests/auth/BidRequestAdd.spec.js --project=chromium --headed --workers=1

# 2. Bid Request Accept
npx playwright test tests/auth/BidRequestAccept.spec.js --project=chromium --headed --workers=1

# 3. Bid Request Prized
npx playwright test tests/auth/BidRequestPrized.spec.js --project=chromium --headed --workers=1

# 4. Bid Request Delete
npx playwright test tests/auth/BidRequestDelete.spec.js --project=chromium --headed --workers=1

````


````

## Test Case for Enrollment Remove

# 1. Enrollment Remove
npx playwright test tests/enrollments/enrollment-remove.spec.js --project=chromium --headed --workers=1

## Test Case for Sub Admin

# 2. Sub Admin Add
npx playwright test tests/auth/SubAdminAdd.spec.js --project=chromium --headed --workers=1

# 3. Sub Admin Delete
npx playwright test tests/auth/SubAdminDelete.spec.js --project=chromium --headed --workers=1

## Test Case for Designation 

# 4. Designation Add
npx playwright test tests/auth/DesignationAdd.spec.js --project=chromium --headed --workers=1

# 5. Designation Delete
npx playwright test tests/auth/DesignationDelete.spec.js --project=chromium --headed --workers=1

## Test Case for Customer approve and unapprove 

# 6. Customer Approve
npx playwright test tests/customers/customer-approve.spec.js --project=chromium --headed --workers=1

# 7. Customer Unapprove
npx playwright test tests/customers/customer-unapprove.spec.js --project=chromium --headed --workers=1

# 8. View Playwright Report
npx playwright show-report

## Playwrite Testcase for Loan Penalty Add 

npx playwright test "tests/auth/LoanPenaltyAdd.spec.js" --project=chromium --headed --workers=1

## Playwrite Testcase for Loan Penalty View

npx playwright test "tests/auth/LoanViewPenalty.spec.js" --project=chromium --headed --workers=1

## Playwrite Testcase for Loan Penalty Delete

npx playwright test "tests/auth/LoanPenaltyDelete.spec.js" --project=chromium --headed --workers=1

````

````

## Playwrite Testcase for Employee UnVerify 

npx playwright test "tests/auth/EmployeeUnverify.spec.js" --project=chromium --headed --workers=1  

## Playwrite Testcase for Agent UnVerify 

npx playwright test "tests/auth/AgentUnverify.spec.js" --project=chromium --headed --workers=1

````

````

# 1. Leads Edit
npx playwright test tests/auth/LeadsEdit.spec.js --project=chromium --headed --workers=1

# 2. Task Edit
npx playwright test tests/auth/TaskEdit.spec.js --project=chromium --headed --workers=1

# 3. Guarantor Edit
npx playwright test tests/auth/GuarantorEdit.spec.js --project=chromium --headed --workers=1

# 4. Co-Applicant Edit
npx playwright test tests/auth/Co-ApplicantEdit.spec.js --project=chromium --headed --workers=1

# 5. Chit Penalty Edit
npx playwright test tests/auth/ChitPenaltyEdit.spec.js --project=chromium --headed --workers=1

# 6. Loan Penalty Edit
npx playwright test tests/auth/LoanPenaltyEdit.spec.js --project=chromium --headed --workers=1

# 7. Agent Edit
npx playwright test tests/auth/AgentEdit.spec.js --project=chromium --headed --workers=1

# 8. Employee Edit
npx playwright test tests/auth/EmployeeEdit.spec.js --project=chromium --headed --workers=1

# Run all test cases
npx playwright test --project=chromium --headed --workers=1

````


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

In VS Code:

1. Open the Command Palette.
2. Select `Terminal: Select Default Profile`.
3. Choose Command Prompt.
4. Open a new terminal.

Test:

```cmd
echo Hello
```

## 6. Loan Table Not Found

The Requests and Pending tables may use different column names.

Possible name columns:

- Customer Name
- Borrower Name

Possible action columns:

- Action
- Actions

## 7. Matching Loans Found: 0

Check the phone number, loan status tab, search loading state, and whether the target loan exists.

## 8. Multiple Matching Loans

Stop the automation rather than choosing an arbitrary record. Use additional identifiers.

## 9. Action Menu Not Found

Inspect the Actions cell and verify the actual control used by the application.

## 10. Loan Status Not Updated

Check:

```dotenv
ENABLE_LOAN_STATUS_UPDATE=false
```

When set to `false`, the workflow is a dry run.

---

# Automation Best Practices

- Maintain reusable helper functions.
- Keep test data separate from test logic.
- Use consistent file naming.
- Prefer explicit assertions.
- Reuse login sessions where appropriate.
- Avoid unnecessary browser reloads.
- Capture failure screenshots.
- Maintain clear terminal logs.
- Generate reports for validation results.
- Confirm business rules before raising bugs.
- Use unique test identifiers.
- Review code before merging into the main branch.

---

# Future Improvements

- Complete automatic positive and negative customer validation using dataset values.
- Verify field-specific validation messages.
- Improve customer creation persistence verification.
- Implement Page Object Model classes.
- Improve reusable fixtures.
- Add more negative test cases.
- Improve test data isolation.
- Add automated cleanup.
- Integrate CI/CD pipelines.
- Improve execution performance.
- Expand Branch, Visitor, and Pigmy automation coverage.
- Generate structured bug reports across modules.

---

## Author

**QA Automation Testing Project**

MyChits Admin Web Application

Developed using Playwright and JavaScript.