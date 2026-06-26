# SPUG Energy Portal

Rebuilt with **Vite + React + Tailwind CSS + Supabase**

---

## 🚀 Quick Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) → your project
2. Open **SQL Editor**
3. Paste and run the entire contents of `supabase-setup.sql`

### 3. Get your Supabase credentials
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key

### 4. Configure environment
Edit `.env` with your actual values:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Create user accounts
In Supabase Dashboard → **Authentication → Users → Add user**

- Email format: `username@spug.internal`
- Example: `admin@spug.internal` / password of your choice
- This maps to username `admin` on the login screen

### 6. Run the app
```bash
npm run dev
```

---

## 📊 Adding / Updating Data

To add new monthly rows, use Supabase Dashboard → **Table Editor → spug schema**:

Or run SQL like:
```sql
INSERT INTO spug.dpi_data (month, tcgr, energy_offtake, contracted_energy, capacity_fee, variable_om, fuel_fee, paleco_bill)
VALUES ('Jul 2025', 13.5000, 12500000, 11896560, 26000000, 13000000, 130000000, 169000000);
```

**Tables:**
| Table | Dashboard |
|-------|-----------|
| `spug.dpi_data` | Delta P, Inc. |
| `spug.inpc_data` | Isla Norte Power Corporation |
| `spug.cipc_busuanga_data` | CIPC — Busuanga |
| `spug.cipc_coron_data` | CIPC — Coron |
| `spug.cipc_epsa_data` | CIPC — EPSA |

**Column reference:**
| Column | Type | Description |
|--------|------|-------------|
| `month` | TEXT | e.g. `'Jan 2025'` |
| `tcgr` | NUMERIC | True Cost Generation Rate (₱/kWh) |
| `energy_offtake` | NUMERIC | kWh this billing period |
| `contracted_energy` | NUMERIC | Contracted kWh |
| `capacity_fee` | NUMERIC | ₱ |
| `variable_om` | NUMERIC | Variable O&M Fee ₱ |
| `fuel_fee` | NUMERIC | ₱ |
| `paleco_bill` | NUMERIC | Total billed to PALECO ₱ |

---

## 🏗 Project Structure
```
src/
  lib/
    supabase.js      # Supabase client
    auth.js          # Auth helpers
  hooks/
    useAuth.js       # Auth state hook
    useDashboardData.js # Data fetching hook
  pages/
    LoginPage.jsx    # Login screen
    HomePage.jsx     # Company selection
    DashboardPage.jsx # Energy dashboard
  components/
    DashboardLayout.jsx # Shared layout
    StatCard.jsx     # KPI stat card
  data/
    seedData.js      # Reference seed data
  App.jsx            # Router
  index.css          # Global styles + Tailwind
```

---

## 🎨 Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Teal | `#75b5b4` | Primary brand, charts |
| Dark Moss | `#00313a` | Headers, text |
| Sky Blue | `#d4eef5` | Backgrounds, borders |
| Off White | `#f1f2f2` | Page background |
| Sea Blue | `#9bbfde` | VIHI / secondary charts |
| Ember Red | `#a24f4f` | VEC / alerts / fuel fee |
| Dark Blue | `#005697` | INPC / energy offtake |
| Lavender | `#a49fc8` | CIPC accents |
| Pistachio | `#baebda` | Positive indicators |
