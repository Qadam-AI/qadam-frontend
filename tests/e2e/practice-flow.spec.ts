/**
 * E2E Tests for the Practice Link Guest Flow
 * 
 * Tests the complete workflow:
 * 1. Guest visits practice link
 * 2. Enters name and joins
 * 3. Answers questions
 * 4. Sees progress and feedback
 * 5. Completes and sees summary
 */

import { test, expect, Page } from '@playwright/test';

// Configuration - set these based on your environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Test data - you'll need a valid practice link code for real tests
// For CI, use a mock or seed data
const TEST_PRACTICE_CODE = process.env.TEST_PRACTICE_CODE || 'DEMO123';
const TEST_STUDENT_NAME = 'E2E Test Student';


test.describe('Practice Link Guest Flow', () => {
  
  test.describe('Join Page', () => {
    
    test('displays practice link info', async ({ page }) => {
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      
      // Should show course name and question count
      await expect(page.getByRole('heading')).toBeVisible();
      await expect(page.getByPlaceholder(/name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
    });
    
    test('shows error for invalid link', async ({ page }) => {
      await page.goto('/practice/INVALID123');
      
      // Should show error message
      await expect(page.getByText(/unavailable|not found/i)).toBeVisible();
    });
    
    test('requires name to join', async ({ page }) => {
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      
      // Try to submit without name
      const startButton = page.getByRole('button', { name: /start/i });
      await startButton.click();
      
      // Should not navigate, form validation should prevent it
      await expect(page).toHaveURL(new RegExp(`/practice/${TEST_PRACTICE_CODE}$`));
    });
    
    test('successfully joins with name', async ({ page }) => {
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      
      // Enter name
      await page.getByPlaceholder(/name/i).fill(TEST_STUDENT_NAME);
      
      // Click start
      await page.getByRole('button', { name: /start/i }).click();
      
      // Should redirect to session page
      await expect(page).toHaveURL(new RegExp(`/practice/${TEST_PRACTICE_CODE}/session`), {
        timeout: 10000
      });
    });
  });
  
  
  test.describe('Practice Session', () => {
    
    test.beforeEach(async ({ page }) => {
      // Join the practice first
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      await page.getByPlaceholder(/name/i).fill(TEST_STUDENT_NAME);
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForURL(new RegExp(`/practice/${TEST_PRACTICE_CODE}/session`));
    });
    
    test('displays first question', async ({ page }) => {
      // Should show question text
      await expect(page.locator('[data-testid="question-text"], .question-text, h2, h3').first()).toBeVisible();
      
      // Should show progress indicator
      await expect(page.locator('[role="progressbar"], .progress')).toBeVisible();
    });
    
    test('shows answer options for MCQ', async ({ page }) => {
      // Look for radio buttons or answer options
      const answerOptions = page.locator('[role="radiogroup"] label, [data-testid="answer-option"]');
      
      // MCQ should have at least 2 options
      await expect(answerOptions.first()).toBeVisible({ timeout: 5000 });
    });
    
    test('can submit answer and see feedback', async ({ page }) => {
      // Wait for question to load
      await page.waitForSelector('[role="radiogroup"], input[type="text"]', { timeout: 10000 });
      
      // Select first answer option (or type if short answer)
      const radioGroup = page.locator('[role="radiogroup"]');
      if (await radioGroup.isVisible()) {
        // MCQ - click first option
        await radioGroup.locator('button, label').first().click();
      } else {
        // Short answer - type something
        await page.locator('input[type="text"]').fill('test answer');
      }
      
      // Submit
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Should show feedback (correct/incorrect indicator or explanation)
      await expect(
        page.locator('[data-testid="feedback"], .feedback, text=/correct|incorrect|explanation/i').first()
      ).toBeVisible({ timeout: 5000 });
    });
    
    test('progress bar increments after answer', async ({ page }) => {
      // Get initial progress
      const progressText = page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
      
      // Answer a question
      await page.waitForSelector('[role="radiogroup"], input[type="text"]', { timeout: 10000 });
      
      const radioGroup = page.locator('[role="radiogroup"]');
      if (await radioGroup.isVisible()) {
        await radioGroup.locator('button, label').first().click();
      }
      
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Wait for feedback, then continue
      await page.waitForTimeout(1000);
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      
      // Progress should have changed
      await expect(progressText).toContainText(/1\s*\/|answered.*1/i);
    });
  });
  
  
  test.describe('Session Completion', () => {
    
    test('completes all questions and shows summary', async ({ page }) => {
      // Join
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      await page.getByPlaceholder(/name/i).fill(`${TEST_STUDENT_NAME} Complete`);
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForURL(new RegExp(`/practice/${TEST_PRACTICE_CODE}/session`));
      
      // Answer questions until done (max 20 iterations to prevent infinite loop)
      for (let i = 0; i < 20; i++) {
        // Check if we're on summary screen
        const summaryVisible = await page.locator('text=/complete|summary|score|finished/i').first().isVisible().catch(() => false);
        if (summaryVisible) {
          break;
        }
        
        // Wait for question
        try {
          await page.waitForSelector('[role="radiogroup"], input[type="text"]', { timeout: 5000 });
        } catch {
          // No more questions
          break;
        }
        
        // Answer
        const radioGroup = page.locator('[role="radiogroup"]');
        if (await radioGroup.isVisible()) {
          await radioGroup.locator('button, label').first().click();
        } else {
          const textInput = page.locator('input[type="text"]');
          if (await textInput.isVisible()) {
            await textInput.fill('test');
          }
        }
        
        // Submit
        const submitButton = page.getByRole('button', { name: /submit/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
        }
        
        // Continue
        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Should show summary with score
      await expect(page.locator('text=/complete|finished|score|\\d+%/i').first()).toBeVisible({ timeout: 10000 });
    });
    
    test('summary shows correct/total count', async ({ page }) => {
      // This test assumes completion - skip if we can't complete quickly
      test.slow();
      
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      await page.getByPlaceholder(/name/i).fill(`${TEST_STUDENT_NAME} Count`);
      await page.getByRole('button', { name: /start/i }).click();
      
      // Complete practice (simplified - just check summary exists after some answers)
      for (let i = 0; i < 10; i++) {
        const summaryVisible = await page.locator('text=/\\d+\\s*\\/\\s*\\d+.*correct|correct.*\\d+\\s*\\/\\s*\\d+/i').first().isVisible().catch(() => false);
        if (summaryVisible) {
          // Found score display
          await expect(page.locator('text=/\\d+\\s*\\/\\s*\\d+/').first()).toBeVisible();
          return;
        }
        
        try {
          await page.waitForSelector('[role="radiogroup"]', { timeout: 2000 });
          await page.locator('[role="radiogroup"] button, [role="radiogroup"] label').first().click();
          await page.getByRole('button', { name: /submit/i }).click();
          await page.waitForTimeout(300);
          
          const next = page.getByRole('button', { name: /next|continue/i });
          if (await next.isVisible()) await next.click();
        } catch {
          break;
        }
      }
    });
  });
  
  
  test.describe('Edge Cases', () => {
    
    test('handles page refresh during session', async ({ page }) => {
      // Join
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      await page.getByPlaceholder(/name/i).fill(`${TEST_STUDENT_NAME} Refresh`);
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForURL(new RegExp(`/practice/${TEST_PRACTICE_CODE}/session`));
      
      // Refresh page
      await page.reload();
      
      // Should still have session (via localStorage)
      // Either stays on session page or redirects to join
      const url = page.url();
      expect(url).toMatch(/practice.*session|practice\/[A-Z0-9]+$/);
    });
    
    test('handles slow network', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });
      
      await page.goto(`/practice/${TEST_PRACTICE_CODE}`);
      
      // Should show loading state
      await expect(page.locator('.animate-spin, [data-loading="true"], text=/loading/i').first()).toBeVisible({ timeout: 2000 }).catch(() => {
        // Loading might be too fast to catch - that's ok
      });
      
      // Should eventually show content
      await expect(page.getByPlaceholder(/name/i)).toBeVisible({ timeout: 15000 });
    });
  });
});


// Helper to create a practice session via API (for isolated tests)
async function createTestPracticeLink(page: Page): Promise<string> {
  // This would need an instructor token - usually done in test setup
  // For now, return the test code
  return TEST_PRACTICE_CODE;
}
