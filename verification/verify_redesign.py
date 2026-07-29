import asyncio
from playwright.async_api import async_playwright
import os

async def verify_mobile_layout():
    async with async_playwright() as p:
        # Launch browser headless
        browser = await p.chromium.launch()

        # Set viewport to a typical iPhone 12/13/14 viewport (390x844)
        context = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        # Step 0: Bypass Intro
        print("Bypassing intro...")
        await page.goto("http://localhost:8080")
        await page.evaluate("localStorage.setItem('vaw_hasCompletedIntro', 'true')")

        # Step 1: Check Login Page on Mobile
        print("Checking Login Page on Mobile...")
        await page.goto("http://localhost:8080/staff/login")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/mobile_login.png")

        # Step 2: Check Monthly Planner Page
        print("Checking Monthly Planner Page on Mobile...")
        await page.goto("http://localhost:8080/monthlyplanner")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/mobile_planner.png")

        await browser.close()
        print("Verification screens captured successfully.")

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_mobile_layout())
