-- =============================================================
-- SPUG PORTAL — Supabase Setup Script
-- Run this in: Supabase Dashboard → SQL Editor
-- Schema: spug (you should have created this already)
-- =============================================================

-- 1. Enable the spug schema (if not already done)
-- CREATE SCHEMA IF NOT EXISTS spug;

-- 2. Grant access to anon and authenticated roles
GRANT USAGE ON SCHEMA spug TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA spug TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA spug GRANT SELECT ON TABLES TO anon, authenticated;

-- =============================================================
-- 3. Create tables
-- =============================================================

CREATE TABLE IF NOT EXISTS spug.dpi_data (
  id               BIGSERIAL PRIMARY KEY,
  month            TEXT NOT NULL,
  tcgr             NUMERIC(10,4) NOT NULL,
  energy_offtake   NUMERIC(20,2) NOT NULL,
  contracted_energy NUMERIC(20,2) NOT NULL,
  capacity_fee     NUMERIC(20,2) NOT NULL,
  variable_om      NUMERIC(20,2) NOT NULL,
  fuel_fee         NUMERIC(20,2) NOT NULL,
  paleco_bill      NUMERIC(20,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spug.inpc_data (
  id               BIGSERIAL PRIMARY KEY,
  month            TEXT NOT NULL,
  tcgr             NUMERIC(10,4) NOT NULL,
  energy_offtake   NUMERIC(20,2) NOT NULL,
  contracted_energy NUMERIC(20,2) NOT NULL,
  capacity_fee     NUMERIC(20,2) NOT NULL,
  variable_om      NUMERIC(20,2) NOT NULL,
  fuel_fee         NUMERIC(20,2) NOT NULL,
  paleco_bill      NUMERIC(20,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spug.cipc_busuanga_data (
  id               BIGSERIAL PRIMARY KEY,
  month            TEXT NOT NULL,
  tcgr             NUMERIC(10,4) NOT NULL,
  energy_offtake   NUMERIC(20,2) NOT NULL,
  contracted_energy NUMERIC(20,2) NOT NULL,
  capacity_fee     NUMERIC(20,2) NOT NULL,
  variable_om      NUMERIC(20,2) NOT NULL,
  fuel_fee         NUMERIC(20,2) NOT NULL,
  paleco_bill      NUMERIC(20,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spug.cipc_coron_data (
  id               BIGSERIAL PRIMARY KEY,
  month            TEXT NOT NULL,
  tcgr             NUMERIC(10,4) NOT NULL,
  energy_offtake   NUMERIC(20,2) NOT NULL,
  contracted_energy NUMERIC(20,2) NOT NULL,
  capacity_fee     NUMERIC(20,2) NOT NULL,
  variable_om      NUMERIC(20,2) NOT NULL,
  fuel_fee         NUMERIC(20,2) NOT NULL,
  paleco_bill      NUMERIC(20,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spug.cipc_epsa_data (
  id               BIGSERIAL PRIMARY KEY,
  month            TEXT NOT NULL,
  tcgr             NUMERIC(10,4) NOT NULL,
  energy_offtake   NUMERIC(20,2) NOT NULL,
  contracted_energy NUMERIC(20,2) NOT NULL,
  capacity_fee     NUMERIC(20,2) NOT NULL,
  variable_om      NUMERIC(20,2) NOT NULL,
  fuel_fee         NUMERIC(20,2) NOT NULL,
  paleco_bill      NUMERIC(20,2) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 4. Seed DPI data (from your CSV file)
-- =============================================================
INSERT INTO spug.dpi_data (month, tcgr, energy_offtake, contracted_energy, capacity_fee, variable_om, fuel_fee, paleco_bill) VALUES
  ('Jan 2025', 13.9110, 12042720.00, 11896560.00, 25483599.79, 12668941.44, 129374090.73, 167526631.96),
  ('Feb 2025', 14.2190, 14397600.00, 11896560.00, 30466761.36, 15146275.20, 159106747.22, 204719783.78),
  ('Mar 2025', 14.3233, 13310400.00, 11896560.00, 28166137.44, 14002540.80, 148480255.93, 190648934.17),
  ('Apr 2025', 13.9886, 15028320.00, 11896560.00, 31801427.95, 15809792.64, 162614173.84, 210225394.43),
  ('May 2025', 13.6443, 13841760.00, 11896560.00, 29290548.34, 14561531.52, 145008641.00, 188860720.86),
  ('Jun 2025', 13.3487, 12345600.00, 11896560.00, 26124524.16, 12987571.20, 125685884.83, 164797980.19)
ON CONFLICT DO NOTHING;

-- =============================================================
-- 5. Seed INPC data (sample — replace with your real data)
-- =============================================================
INSERT INTO spug.inpc_data (month, tcgr, energy_offtake, contracted_energy, capacity_fee, variable_om, fuel_fee, paleco_bill) VALUES
  ('Jan 2025', 12.8500, 8500000, 8000000, 18000000, 9500000, 89000000, 116500000),
  ('Feb 2025', 13.1200, 9200000, 8000000, 19500000, 10200000, 96800000, 126500000),
  ('Mar 2025', 13.4500, 8800000, 8000000, 18800000, 9800000,  93200000, 121800000),
  ('Apr 2025', 13.2100, 9500000, 8000000, 20200000, 10600000, 99700000, 130500000),
  ('May 2025', 12.9800, 8900000, 8000000, 19200000, 9900000,  91900000, 121000000),
  ('Jun 2025', 12.7300, 8300000, 8000000, 18100000, 8900000,  85600000, 112600000)
ON CONFLICT DO NOTHING;

-- =============================================================
-- 6. Seed CIPC Busuanga data (sample)
-- =============================================================
INSERT INTO spug.cipc_busuanga_data (month, tcgr, energy_offtake, contracted_energy, capacity_fee, variable_om, fuel_fee, paleco_bill) VALUES
  ('Jan 2025', 15.2300, 3200000, 3000000, 7200000, 3800000, 37800000, 48800000),
  ('Feb 2025', 15.6100, 3600000, 3000000, 8100000, 4200000, 43400000, 55700000),
  ('Mar 2025', 15.8700, 3400000, 3000000, 7800000, 3900000, 41200000, 52900000),
  ('Apr 2025', 15.4900, 3700000, 3000000, 8400000, 4400000, 44800000, 57600000),
  ('May 2025', 15.1200, 3300000, 3000000, 7600000, 3700000, 38900000, 50200000),
  ('Jun 2025', 14.8800, 3100000, 3000000, 7100000, 3400000, 35600000, 46100000)
ON CONFLICT DO NOTHING;

-- =============================================================
-- 7. Seed CIPC Coron data (sample)
-- =============================================================
INSERT INTO spug.cipc_coron_data (month, tcgr, energy_offtake, contracted_energy, capacity_fee, variable_om, fuel_fee, paleco_bill) VALUES
  ('Jan 2025', 16.1200, 2100000, 2000000, 4900000, 2600000, 27400000, 34900000),
  ('Feb 2025', 16.4800, 2400000, 2000000, 5600000, 2900000, 31200000, 39700000),
  ('Mar 2025', 16.7300, 2200000, 2000000, 5200000, 2700000, 28900000, 36800000),
  ('Apr 2025', 16.3500, 2500000, 2000000, 5900000, 3100000, 32800000, 41800000),
  ('May 2025', 16.0100, 2200000, 2000000, 5100000, 2600000, 28100000, 35800000),
  ('Jun 2025', 15.7800, 2000000, 2000000, 4800000, 2300000, 25600000, 32700000)
ON CONFLICT DO NOTHING;

-- =============================================================
-- 8. Seed CIPC EPSA data (sample)
-- =============================================================
INSERT INTO spug.cipc_epsa_data (month, tcgr, energy_offtake, contracted_energy, capacity_fee, variable_om, fuel_fee, paleco_bill) VALUES
  ('Jan 2025', 14.5600, 1800000, 1700000, 4100000, 2200000, 21700000, 28000000),
  ('Feb 2025', 14.8900, 2000000, 1700000, 4600000, 2500000, 24400000, 31500000),
  ('Mar 2025', 15.1200, 1900000, 1700000, 4400000, 2300000, 22900000, 29600000),
  ('Apr 2025', 14.7800, 2100000, 1700000, 4900000, 2600000, 25700000, 33200000),
  ('May 2025', 14.4300, 1900000, 1700000, 4200000, 2200000, 21900000, 28300000),
  ('Jun 2025', 14.2100, 1700000, 1700000, 3900000, 1900000, 19700000, 25500000)
ON CONFLICT DO NOTHING;

-- =============================================================
-- 9. Enable Row Level Security (RLS) — authenticated users only
-- =============================================================
ALTER TABLE spug.dpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE spug.inpc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE spug.cipc_busuanga_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE spug.cipc_coron_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE spug.cipc_epsa_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dpi_data" ON spug.dpi_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read inpc_data" ON spug.inpc_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read cipc_busuanga_data" ON spug.cipc_busuanga_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read cipc_coron_data" ON spug.cipc_coron_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read cipc_epsa_data" ON spug.cipc_epsa_data FOR SELECT TO authenticated USING (true);

-- =============================================================
-- Done! ✅
-- Next: Create users in Supabase Auth (see README)
-- =============================================================
