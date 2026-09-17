import { Pool } from "pg";
import { requireIsolatedAuthDatabase } from "./auth-database";

declare global {
  // eslint-disable-next-line no-var
  var _dapurPgPool: Pool | undefined;
}

export function getDapurDbPool(): Pool {
  if (!global._dapurPgPool) {
    const databaseUrl = requireIsolatedAuthDatabase(process.env.DATABASE_URL);
    global._dapurPgPool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return global._dapurPgPool;
}

let isInitialized = false;

export async function ensureShopeeTables(): Promise<void> {
  if (isInitialized) return;
  const pool = getDapurDbPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopee_transactions (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64),
      order_customer_name VARCHAR(255),
      amount NUMERIC(15, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'IDR',
      status INTEGER NOT NULL,
      status_name VARCHAR(50),
      issuer_name VARCHAR(100),
      merchant_id VARCHAR(64),
      store_id VARCHAR(64),
      terminal_id VARCHAR(64),
      reference_id VARCHAR(100),
      service_type INTEGER DEFAULT 1,
      transaction_time BIGINT NOT NULL,
      transaction_date TIMESTAMPTZ NOT NULL,
      raw_data JSONB,
      sync_source VARCHAR(50) DEFAULT 'partner_api',
      matched_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_shopee_tx_date ON shopee_transactions (transaction_date DESC);
    CREATE INDEX IF NOT EXISTS idx_shopee_tx_amount ON shopee_transactions (amount);
    CREATE INDEX IF NOT EXISTS idx_shopee_tx_order_id ON shopee_transactions (order_id);

    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  isInitialized = true;
}

export interface ShopeeTxRecord {
  id: string;
  order_id?: string | null;
  order_customer_name?: string | null;
  amount: number;
  currency?: string;
  status: number;
  status_name?: string;
  issuer_name?: string;
  merchant_id?: string;
  store_id?: string;
  terminal_id?: string;
  reference_id?: string;
  service_type?: number;
  transaction_time: number;
  raw_data?: any;
  sync_source?: string;
  matched_at?: string | null;
}

export function parseShopeeAmount(val: string | number | undefined): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function upsertShopeeTransactions(
  transactions: ShopeeTxRecord[],
): Promise<{ inserted: number; updated: number }> {
  if (!transactions.length) return { inserted: 0, updated: 0 };
  await ensureShopeeTables();
  const pool = getDapurDbPool();

  let inserted = 0;
  let updated = 0;

  for (const tx of transactions) {
    const txDate = new Date(tx.transaction_time);

    const query = `
      INSERT INTO shopee_transactions (
        id, order_id, order_customer_name, amount, currency,
        status, status_name, issuer_name, merchant_id, store_id,
        terminal_id, reference_id, service_type, transaction_time,
        transaction_date, raw_data, sync_source, matched_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        status_name = EXCLUDED.status_name,
        issuer_name = COALESCE(EXCLUDED.issuer_name, shopee_transactions.issuer_name),
        order_id = COALESCE(shopee_transactions.order_id, EXCLUDED.order_id),
        order_customer_name = COALESCE(shopee_transactions.order_customer_name, EXCLUDED.order_customer_name),
        matched_at = COALESCE(shopee_transactions.matched_at, EXCLUDED.matched_at),
        raw_data = COALESCE(EXCLUDED.raw_data, shopee_transactions.raw_data),
        updated_at = NOW()
      RETURNING (xmax = 0) AS is_inserted;
    `;

    const values = [
      tx.id,
      tx.order_id || null,
      tx.order_customer_name || null,
      tx.amount,
      tx.currency || "IDR",
      tx.status,
      tx.status_name || "",
      tx.issuer_name || "",
      tx.merchant_id || "",
      tx.store_id || "",
      tx.terminal_id || "",
      tx.reference_id || "",
      tx.service_type || 1,
      tx.transaction_time,
      txDate,
      tx.raw_data ? JSON.stringify(tx.raw_data) : null,
      tx.sync_source || "partner_api",
      tx.matched_at ? new Date(tx.matched_at) : null,
    ];

    const res = await pool.query(query, values);
    if (res.rows[0]?.is_inserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  return { inserted, updated };
}

export async function linkTransactionToOrder(
  transactionId: string,
  orderId: string,
  customerName?: string,
): Promise<boolean> {
  await ensureShopeeTables();
  const pool = getDapurDbPool();

  const res = await pool.query(
    `
    UPDATE shopee_transactions
    SET
      order_id = $1,
      order_customer_name = COALESCE($2, order_customer_name),
      matched_at = NOW(),
      updated_at = NOW()
    WHERE id = $3
  `,
    [orderId, customerName || null, transactionId],
  );

  return (res.rowCount ?? 0) > 0;
}

export async function getEffectiveShopeeToken(): Promise<string> {
  try {
    await ensureShopeeTables();
    const pool = getDapurDbPool();
    const res = await pool.query(
      "SELECT value FROM system_settings WHERE key = 'SHOPEE_PARTNER_TOKEN' LIMIT 1",
    );
    if (res.rows[0]?.value) {
      return res.rows[0].value;
    }
  } catch (_e) {
    // fallback to env
  }
  return process.env.SHOPEE_PARTNER_TOKEN || "";
}

export async function setEffectiveShopeeToken(token: string): Promise<void> {
  await ensureShopeeTables();
  const pool = getDapurDbPool();
  await pool.query(
    `
    INSERT INTO system_settings (key, value, description, updated_at)
    VALUES ('SHOPEE_PARTNER_TOKEN', $1, 'ShopeePay Partner session token for merchant API', NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `,
    [token],
  );
}

export interface ShopeeListQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  statusFilter?: "all" | "claimed" | "unclaimed";
  startDate?: string;
  endDate?: string;
}

export interface ShopeeTransactionRow {
  id: string;
  order_id: string | null;
  order_customer_name: string | null;
  amount: number;
  currency: string;
  status: number;
  status_name: string;
  issuer_name: string;
  merchant_id: string;
  store_id: string;
  terminal_id: string;
  reference_id: string;
  service_type: number;
  transaction_time: number;
  transaction_date: string;
  raw_data: any;
  sync_source: string;
  matched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopeeSummaryStats {
  totalGross: number;
  totalCount: number;
  claimedCount: number;
  unclaimedCount: number;
  unclaimedAmount: number;
}

export async function getShopeeTransactionsList(
  filters: ShopeeListQueryFilters,
): Promise<{
  data: ShopeeTransactionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  await ensureShopeeTables();
  const pool = getDapurDbPool();

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let pIdx = 1;

  if (filters.statusFilter === "claimed") {
    conditions.push("order_id IS NOT NULL");
  } else if (filters.statusFilter === "unclaimed") {
    conditions.push("order_id IS NULL");
  }

  if (filters.startDate) {
    conditions.push(`transaction_date >= $${pIdx}`);
    params.push(new Date(filters.startDate));
    pIdx++;
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(`transaction_date <= $${pIdx}`);
    params.push(end);
    pIdx++;
  }

  if (filters.search && filters.search.trim() !== "") {
    const s = `%${filters.search.trim()}%`;
    conditions.push(
      `(id ILIKE $${pIdx} OR reference_id ILIKE $${pIdx} OR order_id ILIKE $${pIdx} OR order_customer_name ILIKE $${pIdx} OR issuer_name ILIKE $${pIdx} OR CAST(amount AS TEXT) ILIKE $${pIdx})`,
    );
    params.push(s);
    pIdx++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countQuery = `SELECT COUNT(*)::int AS total FROM shopee_transactions ${whereClause}`;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const dataQuery = `
    SELECT
      id, order_id, order_customer_name, amount::float AS amount,
      currency, status, status_name, issuer_name, merchant_id,
      store_id, terminal_id, reference_id, service_type,
      transaction_time, transaction_date, raw_data, sync_source,
      matched_at, created_at, updated_at
    FROM shopee_transactions
    ${whereClause}
    ORDER BY transaction_date DESC
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `;

  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    data: dataRes.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getShopeeSummaryStats(
  startDate?: string,
  endDate?: string,
): Promise<ShopeeSummaryStats> {
  await ensureShopeeTables();
  const pool = getDapurDbPool();

  const conditions: string[] = ["status = 3"];
  const params: any[] = [];
  let pIdx = 1;

  if (startDate) {
    conditions.push(`transaction_date >= $${pIdx}`);
    params.push(new Date(startDate));
    pIdx++;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(`transaction_date <= $${pIdx}`);
    params.push(end);
    pIdx++;
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const summaryQuery = `
    SELECT
      COALESCE(SUM(amount), 0)::float AS total_gross,
      COUNT(*)::int AS total_count,
      COUNT(*) FILTER (WHERE order_id IS NOT NULL)::int AS claimed_count,
      COUNT(*) FILTER (WHERE order_id IS NULL)::int AS unclaimed_count,
      COALESCE(SUM(amount) FILTER (WHERE order_id IS NULL), 0)::float AS unclaimed_amount
    FROM shopee_transactions
    ${whereClause}
  `;

  const res = await pool.query(summaryQuery, params);
  const row = res.rows[0];

  return {
    totalGross: row?.total_gross || 0,
    totalCount: row?.total_count || 0,
    claimedCount: row?.claimed_count || 0,
    unclaimedCount: row?.unclaimed_count || 0,
    unclaimedAmount: row?.unclaimed_amount || 0,
  };
}
