import asyncio
from playwright.async_api import async_playwright
import os

async def verify_mobile():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch()
        # Create context with mobile viewport (iPhone 12 dimensions)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        # Step 0: Bypass Intro
        print("Bypassing intro...")
        await page.goto("http://localhost:8080")
        await page.evaluate("localStorage.setItem('vaw_hasCompletedIntro', 'true')")

        # Step 1: Login Page
        print("Taking login screen screenshot on mobile...")
        await page.goto("http://localhost:8080/staff/login")
        await page.wait_for_selector("input[placeholder='Enter your username']", timeout=5000)
        await page.screenshot(path="verification/mobile_login_v2.png")

        # Step 2: Monthly Planner Page (or Mobile Planner Tab)
        print("Taking Monthly Planner screen screenshot on mobile...")
        await page.goto("http://localhost:8080/monthlyplanner")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/mobile_planner_v2.png")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_mobile())