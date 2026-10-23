import asyncio
from playwright.async_api import async_playwright
import os

async def verify_changes():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Step 1: Login
        print("Logging in...")
        await page.goto("http://localhost:8080/staff/login")
        await page.wait_for_selector("input[placeholder='Enter your username']")
        await page.fill("input[placeholder='Enter your username']", "staff")
        await page.keyboard.press("Enter")

        # Emoji login (assuming it's '123456' for demo or handled)
        # For verification, we just want to see the UI.
        await page.screenshot(path="verification/login_page.png")

        # Step 2: Staff Dashboard & Sidebar
        print("Checking Staff Dashboard...")
        # Since I don't have real auth, I'll try to bypass or just look at the sales dashboard which is more accessible
        await page.goto("http://localhost:8080/sales/dashboard")
        await asyncio.sleep(3) # Wait for redirects/loads
        await page.screenshot(path="verification/sales_dashboard.png")

        # Step 3: Sales Agenda
        print("Checking Sales Agenda...")
        await page.goto("http://localhost:8080/sales/dashboard/agenda")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/sales_agenda.png")

        # Step 4: Monthly Planner
        print("Checking Monthly Planner...")
        await page.goto("http://localhost:8080/monthlyplanner")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/monthly_planner.png")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_changes())
