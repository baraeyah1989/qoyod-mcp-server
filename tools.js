import { z } from "zod";
import { qoyodRequest } from "./qoyodClient.js";

function textResult(data) {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(err) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { message: err.message, status: err.status, body: err.body },
          null,
          2
        ),
      },
    ],
  };
}

async function safeCall(fn) {
  try {
    return textResult(await fn());
  } catch (err) {
    return errorResult(err);
  }
}

/**
 * Registers all Qoyod tools on the given McpServer instance.
 */
export function registerQoyodTools(server) {
  // 1) Generic escape hatch - covers every resource documented at apidoc.qoyod.com
  // (Accounts, Products, Inventories, Product Categories, Product Units, Vendors,
  //  Purchase Orders, Bills & Bill Payments, Simple Bills & Simple Bill Payments,
  //  Debit Notes, Customers, Quotes, Invoices & Invoice Payments, Credit Notes,
  //  Receipts, Journal Entries).
  server.registerTool(
    "qoyod_request",
    {
      title: "Qoyod: raw API request",
      description:
        "Low-level passthrough to the Qoyod REST API (base https://api.qoyod.com/2.0). " +
        "Use this for any resource/action not covered by a dedicated tool below. " +
        "`path` must start with '/', e.g. '/customers', '/invoices/123'. " +
        "List endpoints support Ransack query params via `query`, e.g. " +
        '{"q[sku_cont]": "acc", "q[s]": "created_at desc"}. ' +
        "See https://apidoc.qoyod.com/ for resource-specific payload shapes.",
      inputSchema: {
        method: z
          .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
          .default("GET")
          .describe("HTTP method"),
        path: z.string().describe("API path starting with '/', e.g. '/customers'"),
        query: z
          .record(z.string())
          .optional()
          .describe("Query string params as key/value pairs"),
        body: z.any().optional().describe("JSON request body for POST/PUT/PATCH"),
      },
    },
    async ({ method, path, query, body }) =>
      safeCall(() => qoyodRequest({ method, path, query, body }))
  );

  // 2) Convenience tools for the most common day-to-day operations.

  server.registerTool(
    "qoyod_list_customers",
    {
      title: "Qoyod: list customers",
      description: "List customers, optionally filtered/sorted with Ransack query params.",
      inputSchema: {
        query: z.record(z.string()).optional(),
      },
    },
    async ({ query }) => safeCall(() => qoyodRequest({ method: "GET", path: "/customers", query }))
  );

  server.registerTool(
    "qoyod_get_customer",
    {
      title: "Qoyod: get customer",
      description: "Fetch a single customer by id.",
      inputSchema: { id: z.union([z.string(), z.number()]) },
    },
    async ({ id }) => safeCall(() => qoyodRequest({ method: "GET", path: `/customers/${id}` }))
  );

  server.registerTool(
    "qoyod_create_customer",
    {
      title: "Qoyod: create customer",
      description:
        "Create a new customer. `data` is the raw JSON body Qoyod expects (verify field names " +
        "against https://apidoc.qoyod.com/ if unsure, e.g. { customer: { name, email, mobile, ... } }).",
      inputSchema: { data: z.any() },
    },
    async ({ data }) =>
      safeCall(() => qoyodRequest({ method: "POST", path: "/customers", body: data }))
  );

  server.registerTool(
    "qoyod_list_products",
    {
      title: "Qoyod: list products",
      description: "List products/inventory items, optionally filtered/sorted with Ransack query params.",
      inputSchema: { query: z.record(z.string()).optional() },
    },
    async ({ query }) => safeCall(() => qoyodRequest({ method: "GET", path: "/products", query }))
  );

  server.registerTool(
    "qoyod_list_invoices",
    {
      title: "Qoyod: list invoices",
      description: "List sales invoices, optionally filtered/sorted with Ransack query params.",
      inputSchema: { query: z.record(z.string()).optional() },
    },
    async ({ query }) => safeCall(() => qoyodRequest({ method: "GET", path: "/invoices", query }))
  );

  server.registerTool(
    "qoyod_get_invoice",
    {
      title: "Qoyod: get invoice",
      description: "Fetch a single invoice by id.",
      inputSchema: { id: z.union([z.string(), z.number()]) },
    },
    async ({ id }) => safeCall(() => qoyodRequest({ method: "GET", path: `/invoices/${id}` }))
  );

  server.registerTool(
    "qoyod_create_invoice",
    {
      title: "Qoyod: create invoice",
      description:
        "Create a new sales invoice. `data` is the raw JSON body Qoyod expects " +
        "(verify against https://apidoc.qoyod.com/).",
      inputSchema: { data: z.any() },
    },
    async ({ data }) =>
      safeCall(() => qoyodRequest({ method: "POST", path: "/invoices", body: data }))
  );

  server.registerTool(
    "qoyod_list_bills",
    {
      title: "Qoyod: list bills (purchases)",
      description: "List vendor bills, optionally filtered/sorted with Ransack query params.",
      inputSchema: { query: z.record(z.string()).optional() },
    },
    async ({ query }) => safeCall(() => qoyodRequest({ method: "GET", path: "/bills", query }))
  );

  server.registerTool(
    "qoyod_list_vendors",
    {
      title: "Qoyod: list vendors",
      description: "List vendors/suppliers, optionally filtered/sorted with Ransack query params.",
      inputSchema: { query: z.record(z.string()).optional() },
    },
    async ({ query }) => safeCall(() => qoyodRequest({ method: "GET", path: "/vendors", query }))
  );

  server.registerTool(
    "qoyod_list_journal_entries",
    {
      title: "Qoyod: list journal entries",
      description: "List manual journal entries, optionally filtered/sorted with Ransack query params.",
      inputSchema: { query: z.record(z.string()).optional() },
    },
    async ({ query }) =>
      safeCall(() => qoyodRequest({ method: "GET", path: "/journal_entries", query }))
  );

  server.registerTool(
    "qoyod_create_journal_entry",
    {
      title: "Qoyod: create journal entry",
      description:
        "Create a manual journal entry. `data` is the raw JSON body Qoyod expects " +
        "(verify against https://apidoc.qoyod.com/).",
      inputSchema: { data: z.any() },
    },
    async ({ data }) =>
      safeCall(() => qoyodRequest({ method: "POST", path: "/journal_entries", body: data }))
  );

  server.registerTool(
    "qoyod_list_accounts",
    {
      title: "Qoyod: list chart-of-accounts entries",
      description: "List accounts from the chart of accounts.",
      inputSchema: { query: z.record(z.string()).optional() },
    },
    async ({ query }) => safeCall(() => qoyodRequest({ method: "GET", path: "/accounts", query }))
  );
}
