import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerQoyodTools } from "./tools.js";

const PORT = process.env.PORT || 3000;

function buildServer() {
  const server = new McpServer({
    name: "qoyod-mcp-server",
    version: "1.0.0",
  });
  registerQoyodTools(server);
  return server;
}

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "qoyod-mcp-server",
    status: "ok",
    mcpEndpoint: "/mcp",
  });
});

// Stateless Streamable HTTP MCP endpoint.
// A fresh McpServer + transport is created per request, which keeps things
// simple and horizontally scalable (no session affinity needed).
app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Streamable HTTP clients may probe with GET/DELETE; this server is stateless
// (no server-initiated notifications, no persistent sessions), so respond
// with 405 as the spec allows.
app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. This server is stateless; use POST /mcp." },
    id: null,
  });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. This server is stateless; use POST /mcp." },
    id: null,
  });
});

app.listen(PORT, () => {
  console.log(`Qoyod MCP server listening on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
