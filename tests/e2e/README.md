# Playwright Configuration and Tests for QADAM Frontend

This directory contains end-to-end tests for the Practice Link flow using Playwright.

## Setup

```bash
cd qadam-frontend
npm install -D @playwright/test
npx playwright install
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/practice-flow.spec.ts
```

## Test Structure

- `practice-flow.spec.ts`: End-to-end test for the guest practice flow
- `fixtures/`: Reusable test fixtures and helpers
