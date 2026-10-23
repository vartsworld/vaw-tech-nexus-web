import asyncio
from playwright.async_api import async_playwright
import os

async def verify_changes():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Step 0: Bypass Intro
        print("Bypassing intro...")
        await page.goto("http://localhost:8080")
        await page.evaluate("localStorage.setItem('vaw_hasCompletedIntro', 'true')")

        # Step 1: Login
        print("Checking Login Page...")
        await page.goto("http://localhost:8080/staff/login")
        await page.wait_for_selector("input[placeholder='Enter your username']")
        await page.screenshot(path="verification/login_page_v2.png")

        # Step 2: Sales Dashboard
        print("Checking Sales Dashboard...")
        await page.goto("http://localhost:8080/sales/dashboard")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/sales_vault.png")

        # Step 3: Sales Agenda
        print("Checking Sales Agenda...")
        await page.goto("http://localhost:8080/sales/dashboard/agenda")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/sales_agenda_v2.png")

        # Step 4: Monthly Planner
        print("Checking Monthly Planner...")
        await page.goto("http://localhost:8080/monthlyplanner")
        await asyncio.sleep(2)
        await page.screenshot(path="verification/monthly_planner_v2.png")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_changes())
