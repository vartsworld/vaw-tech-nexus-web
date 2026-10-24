# Payment Observers Setup & Configuration Guide

VAW Pay employs a **Tri-Channel Observation Engine** where all three methods operate simultaneously to capture payment credit alerts across channels without creating duplicate payments.

---

## Method 1: Gmail Payment Observer

### How It Works
1. Merchant connects their Gmail account via standard Google OAuth2.
2. The Gmail Observer polls messages using Gmail API with filter:
   `subject:(credited OR "UPI" OR "received") is:unread`
3. Extracts amount, bank reference number (UTR), and sender VPA.
4. Normalizes and submits to `POST /api/v1/pollers/events`.

### Setup Steps
1. Create a Google Cloud Project in Google Cloud Console.
2. Enable the **Gmail API**.
3. Create OAuth 2.0 Credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:6003/oauth/callback` (or your domain)
4. Add credentials to `.env`:
   ```env
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REDIRECT_URI=http://localhost:6003/oauth/callback
   ```
5. Navigate to `http://localhost:6003/oauth/url` or Merchant Admin to authorize your Gmail account.

<details>
<summary><b>🔍 Verified Indian Banking Email Domains & RBI <code>.bank.in</code> Mandate (Click to expand)</b></summary>

<br/>

Under Reserve Bank of India (RBI) and IDRBT regulatory standards, scheduled commercial banks in India are migrating their customer alert handles to the sovereign `.bank.in` domain (and NBFCs to `.fin.in`). VAW Pay validates both live `.bank.in` / `.fin.in` addresses and verified legacy commercial notification handles.

#### 1. Official RBI `.bank.in` Migration Domain Registry (Live DNS / MX Verified)

All `.bank.in` domains are automatically accepted by the verification engine (`emailDomain.endsWith('.bank.in')`):

| Bank | Verified Alert Domain | DNS / Mail Server Status | Primary Mail Protection Server |
| :--- | :--- | :--- | :--- |
| **HDFC Bank** | `hdfcbank.bank.in` / `hdfc.bank.in` | `ACTIVE (MX)` | `hdfcbank-bank-in.mail.protection.outlook.com` |
| **ICICI Bank** | `icici.bank.in` | `ACTIVE (MX)` | `icici-bank-in.mail.protection.outlook.com` |
| **State Bank of India** | `sbi.bank.in` | `ACTIVE (MX)` | `sbi-bank-in.mail.protection.outlook.com` |
| **Axis Bank** | `axis.bank.in` | `ACTIVE (MX)` | `axis-bank-in.mail.protection.outlook.com` |
| **Kotak Mahindra Bank** | `kotak.bank.in` | `ACTIVE (MX)` | `kotak.in.tmes-in.trendmicro.com` |
| **Punjab National Bank** | `pnb.bank.in` | `ACTIVE (MX)` | `cluster1a.us.messagelabs.com` |
| **Bank of Baroda** | `bankofbaroda.bank.in` | `ACTIVE (MX)` | `bankofbaroda-bank-in.mail.protection.outlook.com` |
| **IndusInd Bank** | `indusind.bank.in` | `ACTIVE (MX)` | `mx02.indusind.bank.in` |
| **IDFC FIRST Bank** | `idfcfirst.bank.in` | `ACTIVE (MX)` | `mx06.idfcbank.com` |
| **IDBI Bank** | `idbi.bank.in` | `ACTIVE (MX)` | `idbi-bank-in.mail.protection.outlook.com` |
| **Indian Bank** | `indianbank.bank.in` | `ACTIVE (MX)` | `indianbank-bank-in.mail.protection.outlook.com` |

#### 2. Verified Legacy Commercial Banking Domains (Live DNS / MX Verified)

The engine supports root domains and alert subdomains (e.g. `alerts.hdfcbank.net`, `custalert.icicibank.com`):

| Bank | Root Domain | Subdomain Support | Notes & Verification Telemetry |
| :--- | :--- | :--- | :--- |
| **HDFC Bank** | `hdfcbank.net`, `hdfcbank.com` | `*.hdfcbank.net` | Primary automated alert channel (`alerts@hdfcbank.net`) |
| **ICICI Bank** | `icicibank.com` | `*.icicibank.com` | Automated alerts (`custalert.icicibank.com`) |
| **State Bank of India** | `sbi.co.in` | `*.sbi.co.in` | Core banking alerts (`alerts@sbi.co.in`) |
| **Axis Bank** | `axisbank.com` | `*.axisbank.com` | Official notifications |
| **Kotak Mahindra Bank** | `kotak.com`, `kotak.co.in` | `*.kotak.com` | Core notifications |
| **Paytm Payments Bank** | `paytmbank.com`, `paytm.com` | `*.paytm.com` | Merchant & wallet alerts |
| **YES Bank** | `yesbank.in` | `*.yesbank.in` | Core alerts |
| **Punjab National Bank** | `pnb.co.in` | `*.pnb.co.in` | Core alerts |
| **Bank of Baroda** | `bankofbaroda.co.in`, `bankofbaroda.com` | `*.bankofbaroda.co.in` | Automated transaction statements |
| **IndusInd Bank** | `indusind.com` | `*.indusind.com` | Core alerts |
| **IDFC FIRST Bank** | `idfcfirstbank.com`, `idfcbank.com` | `*.idfcbank.com` | Automated alerts |
| **Canara Bank** | `canarabank.com` | `*.canarabank.com` | Automated alerts |
| **Union Bank of India** | `unionbankofindia.co.in` | `*.unionbankofindia.co.in` | Core banking alerts |
| **Federal Bank** | `federalbank.co.in` | `*.federalbank.co.in` | Automated alerts |
| **IDBI Bank** | `idbibank.com` | `*.idbibank.com` | Core banking alerts |

> **Security Note:** Unverified personal domains or spoofed external free-mail providers (`@gmail.com`, `@yahoo.com`, `@outlook.com`) are strictly rejected by the verification pipeline (`INVALID_EMAIL_DOMAIN`).

</details>

---

## Method 2: Android Payment Observer

### How It Works
1. An Android phone with your business receiving SIM/banking apps (PhonePe, GPay, Paytm, BHIM, Bank Apps) runs the native Kotlin app `apps/android-observer-app`.
2. The app uses Android's `NotificationListenerService` to capture incoming status bar notifications.
3. Automatically extracts the amount and UTR.
4. Cryptographically signs the payload with `HMAC-SHA256(signingKey, body + ":" + timestamp)`.
5. Transmits observation to `POST /api/v1/pollers/android/events`.
6. Submits heartbeat to `POST /api/v1/pollers/android/heartbeat` every 60s.

### Pairing Procedure
1. Open Merchant Admin (`http://localhost:6001`).
2. Go to **Observers & Pairing** tab -> Click **+ Pair Android Device**.
3. Open the VAW Pay Observer app on your Android device.
4. Enter or scan the Gateway URL and Enrollment Token.
5. Tap **Pair with Merchant Gateway**. The device will receive its permanent `deviceId` and `signingKey` stored in `EncryptedSharedPreferences`.
6. Grant Notification Listener Access in Android System Settings.

### Binary Verification & Checksum
Operators can verify the cryptographic integrity and authenticity of `youpi-sms-gateway.apk` before sideloading onto merchant Android devices:

- **Target Binary**: `apps/android-observer-app/youpi-sms-gateway.apk` (also mirrored at `/youpi-sms-gateway.apk` on Admin and Payment API)
- **SHA-256 Checksum**: `959218223e75da4784744c16afaf7bc121cff377dff04f041875237042f51601`
- **Verification Command**:
  ```bash
  shasum -a 256 apps/android-observer-app/youpi-sms-gateway.apk
  # Or check against the companion checksum file:
  shasum -a 256 -c apps/android-observer-app/youpi-sms-gateway.apk.sha256
  ```

---

## Method 3: Google Messages / SMS Observer

### How It Works
1. Connects to incoming bank SMS credit alerts via Google Messages Web automation session or SMS gateway forwarder.
2. `apps/sms-observer` parses SMS text:
   - Identifies credit alerts from `VK-SBIUPI`, `VM-HDFCBK`, `AXISBK`, `ICICIB`, etc.
   - Extracts amount and reference number.
3. Submits normalized canonical observation to `POST /api/v1/pollers/events`.
4. Filters out all debits and unrelated notifications.
