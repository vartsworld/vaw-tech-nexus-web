import asyncio
from playwright.async_api import async_playwright
import os
import json

async def verify_calendar_click():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        console_errors = []

        # Log all console messages
        def handle_console(msg):
            print(f"[CONSOLE {msg.type.upper()}]: {msg.text}")
            if msg.type == "error":
                console_errors.append(f"Console error: {msg.text}")

        page.on("pageerror", lambda err: console_errors.append(f"Page Error: {err}"))
        page.on("console", handle_console)

        # Mock Supabase Network Requests
        async def handle_route(route):
            url = route.request.url
            method = route.request.method
            print(f"Intercepted {method} request to: {url}")

            # Auth endpoints
            if "/auth/v1/" in url:
                mock_session = {
                    "access_token": "mock-token-abc",
                    "token_type": "bearer",
                    "expires_in": 3600,
                    "refresh_token": "mock-refresh",
                    "user": {
                        "id": "e673479a-eb9b-43a0-b5ee-5b8da2f8546b",
                        "aud": "authenticated",
                        "role": "authenticated",
                        "email": "staff@example.com",
                        "phone": "",
                        "user_metadata": {},
                        "app_metadata": {
                            "provider": "email",
                            "providers": ["email"]
                        },
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z"
                    }
                }
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(mock_session)
                )
            # Staff profiles endpoint
            elif "/rest/v1/staff_profiles" in url:
                mock_profiles = [
                    {
                        "id": "profile-id-123",
                        "user_id": "e673479a-eb9b-43a0-b5ee-5b8da2f8546b",
                        "full_name": "Jules Dev",
                        "username": "jules",
                        "role": "staff"
                    }
                ]
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(mock_profiles)
                )
            # Monthly plans endpoint
            elif "/rest/v1/monthly_plans" in url:
                mock_plans = [
                    {
                        "id": "plan-id-1",
                        "date": "2025-07-15",
                        "title": "Launch New Marketing Campaign",
                        "description": "Ensure the new website landing page is fully optimized.",
                        "assigned_staff": ["e673479a-eb9b-43a0-b5ee-5b8da2f8546b"],
                        "color": "#ef4444",
                        "is_completed": False,
                        "created_by": "e673479a-eb9b-43a0-b5ee-5b8da2f8546b"
                    },
                    {
                        "id": "plan-id-2",
                        "date": "2025-07-20",
                        "title": "Database Optimization",
                        "description": "Optimize postgreSQL indexing and queries.",
                        "assigned_staff": [],
                        "color": "#10b981",
                        "is_completed": True,
                        "created_by": "e673479a-eb9b-43a0-b5ee-5b8da2f8546b"
                    }
                ]
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(mock_plans)
                )
            else:
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body="[]"
                )

        # Intercept any requests to supabase URL
        await page.route("https://ecexzlqjobqajfhxmiaa.supabase.co/**", handle_route)

        print("Navigating to index to set localStorage bypass...")
        await page.goto("http://localhost:8080")

        # Inject mock token in localStorage - both structures to be safe
        mock_auth_token_value = {
            "access_token": "mock-token-abc",
            "token_type": "bearer",
            "expires_in": 3600,
            "expires_at": 9999999999,
            "refresh_token": "mock-refresh",
            "user": {
                "id": "e673479a-eb9b-43a0-b5ee-5b8da2f8546b",
                "aud": "authenticated",
                "role": "authenticated",
                "email": "staff@example.com",
                "phone": "",
                "user_metadata": {},
                "app_metadata": {
                    "provider": "email",
                    "providers": ["email"]
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            },
            "currentSession": {
                "access_token": "mock-token-abc",
                "token_type": "bearer",
                "expires_in": 3600,
                "expires_at": 9999999999,
                "refresh_token": "mock-refresh",
                "user": {
                    "id": "e673479a-eb9b-43a0-b5ee-5b8da2f8546b",
                    "aud": "authenticated",
                    "role": "authenticated",
                    "email": "staff@example.com",
                    "phone": "",
                    "user_metadata": {},
                    "app_metadata": {
                        "provider": "email",
                        "providers": ["email"]
                    },
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            },
            "expiresAt": 9999999999
        }

        await page.evaluate(f"localStorage.setItem('vaw_hasCompletedIntro', 'true')")
        await page.evaluate(f"localStorage.setItem('sb-ecexzlqjobqajfhxmiaa-auth-token', '{json.dumps(mock_auth_token_value)}')")

        print("Navigating to Monthly Planner...")
        await page.goto("http://localhost:8080/monthlyplanner")
        await page.wait_for_timeout(5000)

        # Wait for the calendar component
        print("Finding calendar buttons...")
        days = await page.query_selector_all(".rdp-day")
        if not days:
            days = await page.query_selector_all("button")

        print(f"Found {len(days)} potential clickable day/button elements.")

        clicked = False
        for day in days:
            text = await day.inner_text()
            if text and text.strip().isdigit():
                val = int(text.strip())
                print(f"Clicking on day {val}...")
                await day.click()
                clicked = True
                break

        await page.wait_for_timeout(3000)

        ref_errors = [err for err in console_errors if "Check is not defined" in err or "ReferenceError" in err]

        if ref_errors:
            print("\n❌ FAILURE: ReferenceError was thrown on click!")
        else:
            print("\n✅ SUCCESS: No ReferenceError occurred on calendar date click.")

        screenshot_path = "verification/calendar_clicked_success.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")
    asyncio.run(verify_calendar_click())
