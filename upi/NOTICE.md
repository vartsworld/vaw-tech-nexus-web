# Notice and attribution

VAW Pay is derived from **YouPI-PG** (https://github.com/youpi-pg/YouPI-PG), an open-source self-hosted UPI payment gateway.

Credit for the upstream project goes to its original author, Gaurav ([gxurav1710](https://github.com/gxurav1710)), its maintainers at [Zenuxs](https://zenuxs.in), and Antigravity Systems (listed as author in the upstream `package.json`).

VAW Technologies imported, rebranded and modified the code with the permission of the upstream maintainers (confirmed by the VAW Technologies project owner). The upstream repository did not include a LICENSE file when it was imported, and its `package.json` declared "Commercial". Keep that written permission on file. This copy is private to VAW Technologies and is marked `UNLICENSED`. Do not redistribute it without the upstream owners' consent.

Changes made by VAW Technologies include:

- Rebranding (names, colours, copy), including removal of unverifiable marketing claims from the checkout page.
- A VAW default merchant seed, a production guard that refuses payments until a real receiving UPI ID is configured, and a `npm run setup` script.
- Responsive layout fixes in the checkout page, admin and control centre.
- Integration with the VAW Technologies website (see `docs/VAW_SITE_INTEGRATION.md`).

Some internal identifiers still carry the upstream name because they are bound to the prebuilt Android app or to stored browser data: package `com.youpi.observer`, the `youpi-sms-gateway.apk` file, the `YOUPI_SMS_GATEWAY_PAIR` payload prefix, `youpi_gateway`, `youpi_device_keystore_v1`, and the IndexedDB name in `checkout.html`. The VAW Pay server and the observer app must keep agreeing on them.

There is no warranty. This software is experimental and is not certified or approved by NPCI, RBI or any bank.
