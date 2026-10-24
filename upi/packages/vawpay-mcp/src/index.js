#!/usr/bin/env node
import readline from 'node:readline';
import {
  TOOLS_DEFINITIONS,
  verifyWebhookSignature,
  generateBankSmsText,
  checkPortHealth
} from './tools.js';

export class VawPayMcpServer {
  constructor(inputStream = process.stdin, outputStream = process.stdout) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
  }

  async handleRequest(request) {
    const { id, method, params } = request;

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'vawpay-mcp-server',
            version: '1.0.0'
          }
        }
      };
    }

    if (method === 'notifications/initialized') {
      return null;
    }

    if (method === 'ping') {
      return { jsonrpc: '2.0', id, result: {} };
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS_DEFINITIONS
        }
      };
    }

    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments || {};

      try {
        let toolResult;
        if (name === 'vawpay_verify_webhook') {
          toolResult = verifyWebhookSignature(args);
        } else if (name === 'vawpay_simulate_bank_notification') {
          const smsText = generateBankSmsText(args);
          toolResult = {
            bank: args.bank,
            amount: args.amount,
            utr: args.utr,
            generatedSms: smsText,
            simulatedWebhookPayload: {
              sender: `VK-${args.bank}BK`,
              body: smsText,
              timestamp: Date.now()
            }
          };
        } else if (name === 'vawpay_check_gateway_health') {
          const ports = [6100, 7000, 6001, 6002, 6003, 5000];
          const checks = await Promise.all(ports.map((p) => checkPortHealth(p, args.host)));
          toolResult = {
            host: args.host || '127.0.0.1',
            services: checks
          };
        } else {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool not found: ${name}` }
          };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2)
              }
            ]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: err.message || 'Internal error' }
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
  }

  start() {
    const rl = readline.createInterface({
      input: this.inputStream,
      output: this.outputStream,
      terminal: false
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const parsed = JSON.parse(trimmed);
        const response = await this.handleRequest(parsed);
        if (response) {
          this.outputStream.write(`${JSON.stringify(response)}\n`);
        }
      } catch (err) {
        this.outputStream.write(
          `${JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' }
          })}\n`
        );
      }
    });
  }
}

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  const server = new VawPayMcpServer();
  server.start();
}
