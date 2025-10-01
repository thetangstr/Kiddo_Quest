// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Button Visibility Check', () => {
  test('Check button visibility and styling', async ({ page }) => {
    // Navigate to the app
    await page.goto('https://kiddo-quest-de7b0.web.app/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/initial-page.png', fullPage: true });
    
    // Check if "Get Started for FREE" button exists and is visible
    const ctaButton = page.getByText('Get Started for FREE');
    await expect(ctaButton).toBeVisible();
    
    // Get button styling information
    const buttonStyles = await ctaButton.evaluate((button) => {
      const styles = window.getComputedStyle(button);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        padding: styles.padding,
        border: styles.border,
        borderRadius: styles.borderRadius,
        opacity: styles.opacity,
        visibility: styles.visibility,
        display: styles.display,
        position: styles.position,
        zIndex: styles.zIndex
      };
    });
    
    console.log('Button styles:', JSON.stringify(buttonStyles, null, 2));
    
    // Highlight the button for screenshot
    await ctaButton.evaluate((button) => {
      button.style.outline = '3px solid red';
    });
    
    // Take screenshot with highlighted button
    await page.screenshot({ path: 'test-results/button-highlighted.png', fullPage: true });
    
    // Check button's bounding box and position
    const boundingBox = await ctaButton.boundingBox();
    console.log('Button bounding box:', boundingBox);
    
    // Verify button is actually clickable
    const isClickable = await ctaButton.isEnabled();
    expect(isClickable).toBeTruthy();
    
    // Check contrast and readability
    const contrastInfo = await ctaButton.evaluate((button) => {
      const styles = window.getComputedStyle(button);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Get parent background for better context
      let parent = button.parentElement;
      let parentBg = 'transparent';
      while (parent && parentBg === 'transparent') {
        parentBg = window.getComputedStyle(parent).backgroundColor;
        parent = parent.parentElement;
      }
      
      return {
        buttonBg: bgColor,
        textColor: textColor,
        parentBg: parentBg,
        buttonText: button.innerText
      };
    });
    
    console.log('Button contrast info:', JSON.stringify(contrastInfo, null, 2));
  });
});