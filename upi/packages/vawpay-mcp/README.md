# @vawpay/mcp-server

Model Context Protocol (MCP) server for **VAW Pay**, enabling AI coding assistants (Claude Desktop, Antigravity, Cursor, Cline) to directly interact with, audit, and simulate payment gateway operations.

---

## Capabilities & Tools

| Tool Name | Description |
| :--- | :--- |
| **`vawpay_check_gateway_health`** | Inspects HTTP operational readiness across ports (6100 Core, 7000 Checkout, 6001 Admin, 6002 SMS, 6003 Gmail). |
| **`vawpay_verify_webhook`** | Verifies HMAC-SHA256 signature over raw request bytes and checks timestamp freshness. |
| **`vawpay_simulate_bank_notification`** | Formats realistic Indian bank SMS templates (SBI, HDFC, ICICI, Axis, Kotak, PNB) and generates mock observer payloads. |

---

## Configuration

Add to your MCP client configuration (`claude_desktop_config.json` or Antigravity `mcp_config.json`):

```json
{
  "mcpServers": {
    "vaw-pay": {
      "command": "node",
      "args": ["packages/vawpay-mcp/src/index.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

---

## Running Standalone

```bash
node packages/vawpay-mcp/src/index.js
```
