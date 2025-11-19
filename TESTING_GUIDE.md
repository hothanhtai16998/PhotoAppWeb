# Testing Guide

## Running Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Tests in Watch Mode
Tests will automatically re-run when you change files:
```bash
npm test
```
(Press `a` to run all tests, `q` to quit)

### Run Tests with UI
Open the Vitest UI in your browser:
```bash
npm run test:ui
```
This opens an interactive test interface at `http://localhost:51204/__vitest__/`

### Run Tests with Coverage Report
See how much of your code is covered by tests:
```bash
npm run test:coverage
```

## Writing Tests

### Test File Location
- Frontend tests: `frontend/src/**/__tests__/*.test.ts` or `*.test.tsx`
- Backend tests: `backend/src/**/__tests__/*.test.js`

### Example Test Structure
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expectedValue);
  });
});
```

### Running Specific Tests
```bash
# Run tests matching a pattern
npm test -- utils

# Run a specific test file
npm test -- utils.test.ts
```

## Current Test Files
- `frontend/src/lib/__tests__/utils.test.ts` - Tests for utility functions
- `backend/src/utils/__tests__/validators.test.js` - Tests for validation functions

## Adding More Tests
1. Create a `__tests__` folder next to your code
2. Create a test file: `myComponent.test.tsx`
3. Write tests using Vitest and React Testing Library
4. Run `npm test` to execute

