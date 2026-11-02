# MyChits Web Automation Testing

## Project Overview
This project contains automated test cases for the MyChits Admin Web Application using Playwright and JavaScript.

The main objective is to automate important application workflows, reduce manual testing, and verify application functionality.

## Technologies Used
- Playwright
- JavaScript
- Node.js
- npm
- Chromium
- Visual Studio Code

## Project Structure

| File / Folder | Description |
|---|---|
| `tests/` | Contains automation test scripts |
| `chromium.spec.js` | MyChits login and customer automation |
| `package.json` | Project dependencies and scripts |
| `package-lock.json` | Dependency version information |
| `playwright.config.js` | Playwright configuration |
| `.github/` | GitHub workflow configuration |

## Installation

Clone the repository:

```bash
git clone https://github.com/mychits/Web-Test-Cases.git
```

Navigate to the project folder:

```bash
cd Web-Test-Cases/Madhan
```

Install dependencies:

```bash
npm install
```

Install Chromium:

```bash
npx playwright install chromium
```

## Run Tests

Run all tests:

```bash
npx playwright test
```

Run tests in visible Chromium browser:

```bash
npx playwright test --project=chromium --headed
```

Run a specific test:

```bash
npx playwright test tests/chromium.spec.js --project=chromium --headed
```

## Automated Test Scenarios

1. Open the MyChits Admin Web Application.
2. Select a branch and log in using Admin ID and OTP.
3. Verify successful dashboard navigation.
4. Navigate to Customer Management.
5. Open the Add Customer page.
6. Enter customer details and save customer records.
7. Verify the customer creation process.

## Test Reports

View the Playwright HTML report:

```bash
npx playwright show-report
```

## Important Notes
- Use authorized testing environments.
- Use test data instead of real customer information.
- Do not upload passwords, OTPs, or sensitive information.
- Avoid committing `node_modules/`, test reports, and unnecessary screenshots.

---

**Project:** MyChits Web Automation Testing  
**Framework:** Playwright  
**Language:** JavaScript  
**Browser:** Chromium
