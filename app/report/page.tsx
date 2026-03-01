'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type WeekData = {
  week: string
  revenue: number
  loaves: number
  clients: number
  ingredientCost: number
}

type ClientPerformance = {
  name: string
  loaves: number
  revenue: number
  trend: 'up' | 'down' | 'stable'
  sellThrough: 'fast' | 'normal' | 'slow'
  change: number
}

type ProductPerformance = {
  name: string
  loaves: number
  revenue: number
  sellThrough: 'fast' | 'normal' | 'slow'
  weeksSlowing: number
}

type AIFlag = {
  type: 'opportunity' | 'warning' | 'info'
  title: string
  body: string
}

// ── Mock data ──────────────────────────────────────────────────────────────

const WEEKLY_TREND: WeekData[] = [
  { week: 'Oct 7',  revenue: 2840, loaves: 490, clients: 4, ingredientCost: 820 },
  { week: 'Oct 14', revenue: 3010, loaves: 520, clients: 4, ingredientCost: 870 },
  { week: 'Oct 21', revenue: 2950, loaves: 505, clients: 5, ingredientCost: 855 },
  { week: 'Oct 28', revenue: 3180, loaves: 555, clients: 5, ingredientCost: 910 },
  { week: 'Nov 4',  revenue: 3420, loaves: 600, clients: 5, ingredientCost: 945 },
]

const THIS_WEEK = WEEKLY_TREND[WEEKLY_TREND.length - 1]
const LAST_WEEK = WEEKLY_TREND[WEEKLY_TREND.length - 2]

const CLIENT_PERFORMANCE: ClientPerformance[] = [
  { name: 'St. Lawrence Market Grocers', loaves: 150, revenue: 897, trend: 'up',     sellThrough: 'fast',   change: 25 },
  { name: 'Roncesvalles Village Market', loaves: 75,  revenue: 461, trend: 'up',     sellThrough: 'fast',   change: 38 },
  { name: 'Bloor Street Deli',           loaves: 60,  revenue: 345, trend: 'stable', sellThrough: 'normal', change: 0  },
  { name: 'Kensington Natural Foods',    loaves: 90,  revenue: 534, trend: 'up',     sellThrough: 'normal', change: 12 },
  { name: 'The Junction Pantry',         loaves: 40,  revenue: 207, trend: 'down',   sellThrough: 'slow',   change: -18 },
]

const PRODUCT_PERFORMANCE: ProductPerformance[] = [
  { name: 'Sourdough',   loaves: 285, revenue: 1852, sellThrough: 'fast',   weeksSlowing: 0 },
  { name: 'Brown Bread', loaves: 140, revenue: 700,  sellThrough: 'normal', weeksSlowing: 0 },
  { name: 'Whole Wheat', loaves: 115, revenue: 632,  sellThrough: 'normal', weeksSlowing: 1 },
  { name: 'Rye Bread',   loaves: 60,  revenue: 360,  sellThrough: 'slow',   weeksSlowing: 2 },
]

const AI_FLAGS: AIFlag[] = [
  {
    type: 'opportunity',
    title: 'Sourdough demand is outpacing supply',
    body: "Two of your fastest-growing clients — St. Lawrence and Roncesvalles — both sold out of sourdough mid-week for the third consecutive week. Combined they're ordering 135 loaves but signalling they could absorb 160–170. Consider offering a capacity increase proactively before they look elsewhere.",
  },
  {
    type: 'warning',
    title: 'The Junction Pantry is showing early churn signals',
    body: "Junction Pantry has reduced their order three weeks in a row — down 18% this week alone — and reported slow sell-through both times. This pattern often precedes a client pausing their order entirely. A brief check-in call this week to understand what's changed would be worth the 10 minutes.",
  },
  {
    type: 'warning',
    title: 'Rye bread margin is thinning',
    body: "Rye bread has the highest ingredient cost per loaf and has had slow sell-through at Kensington for two consecutive weeks. At current volumes it contributes less than 8% of revenue while consuming roughly 14% of ingredient spend. Worth reviewing whether the price point or the production volume needs adjusting.",
  },
  {
    type: 'info',
    title: 'Fifth consecutive week of revenue growth',
    body: "Revenue has grown every single week for five weeks, up 20.4% over that period. The growth is driven primarily by two clients increasing order sizes, not by acquiring new clients. This is healthy — it suggests the product quality is strong. The next growth lever is likely adding one or two new retail partners rather than stretching existing ones further.",
  },
]

const AI_NARRATIVE = `This was your strongest week in five weeks. Revenue came in at $3,420 — up 7.5% on last week and 20.4% on five weeks ago. More importantly the growth is coming from the right place: clients who are selling fast and coming back for more, not from discounting or one-off bulk orders.

The headline story this week is sourdough. It accounted for 47.5% of all loaves and generated $1,852 in revenue — your single highest-earning product by a significant margin. Every client who stocks it is selling through faster than they can reorder. That's a strong signal that your current price point may actually be conservative given the demand.

The concern worth watching is at the bottom of the client list. The Junction Pantry has been quietly shrinking their orders while other clients grow. They haven't flagged anything explicitly but the data pattern — three consecutive reductions with slow sell-through — is consistent with a client reconsidering the relationship. It's not urgent yet but it's worth a conversation before it becomes a gap in your weekly volume.

On costs: ingredient spend was $945 this week, giving you a gross margin of 72.4%. That's healthy for a wholesale bakery. The only product applying pressure to that margin is rye bread, which has both the highest cost per loaf and the slowest sell-through. It's worth a deliberate decision — either price it up to reflect the cost, or reduce the production volume to match what's actually selling.

Overall: the business is growing steadily and the fundamentals are strong. The next meaningful decision in front of you is whether to proactively approach new retail partners to add a sixth client, which would reduce your revenue concentration risk and give your growing production capacity somewhere to go.`

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function pct(a: number, b: number) {
  return (((a - b) / b) * 100).toFixed(1)
}

function TrendArrow({ value }: { value: number }) {
  if (value > 0) return <span style={{ color: 'var(--color-green-text)' }}>↑ +{value}%</span>
  if (value < 0) return <span style={{ color: 'var(--color-red-text)' }}>↓ {value}%</span>
  return <span style={{ color: 'var(--color-text-muted)' }}>→ Stable</span>
}

// ── Sparkline ──────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#C8860A' }: { data: number[]; color?: string }) {
  const w = 120, h = 36, pad = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = (w - pad * 2) / (data.length - 1)

  const points = data.map((v, i) => {
    const x = pad + i * step
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const lastX = pad + (data.length - 1) * step
  const lastY = h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2)

  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function WeeklyReportPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportVisible, setReportVisible] = useState(true)
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null)

  const revenueChange = parseFloat(pct(THIS_WEEK.revenue, LAST_WEEK.revenue))
  const loavesChange  = parseFloat(pct(THIS_WEEK.loaves,  LAST_WEEK.loaves))
  const margin        = ((THIS_WEEK.revenue - THIS_WEEK.ingredientCost) / THIS_WEEK.revenue * 100).toFixed(1)
  const slowProducts  = PRODUCT_PERFORMANCE.filter(p => p.sellThrough === 'slow')
  const topClients    = [...CLIENT_PERFORMANCE].sort((a, b) => b.revenue - a.revenue).slice(0, 3)

  const handleRegenerate = async () => {
    setIsGenerating(true)
    setReportVisible(false)
    await new Promise(r => setTimeout(r, 2200))
    setIsGenerating(false)
    setReportVisible(true)
  }

  const flagColors = {
    opportunity: { border: 'var(--color-green-text)',  bg: 'var(--color-green-subtle)',  icon: '↑', label: 'Opportunity' },
    warning:     { border: 'var(--color-amber-text)',  bg: 'var(--color-amber-subtle)',  icon: '⚠', label: 'Watch' },
    info:        { border: 'var(--color-blue-text)',   bg: 'rgba(122,174,224,0.1)',      icon: '◎', label: 'Note' },
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --color-bg:             #120D09;
          --color-surface:        #1C1410;
          --color-surface-raised: #241A13;
          --color-border:         #3a2e22;
          --color-border-focus:   #C8860A;
          --color-text-primary:   #F5EDD6;
          --color-text-secondary: #C4AD94;
          --color-text-muted:     #9C876F;
          --color-amber-text:     #E8A020;
          --color-amber-btn-bg:   #C8860A;
          --color-amber-btn-text: #120D09;
          --color-green-text:     #6DB860;
          --color-green-subtle:   rgba(109,184,96,0.12);
          --color-red-text:       #E07070;
          --color-red-subtle:     rgba(224,112,112,0.12);
          --color-amber-subtle:   rgba(200,134,10,0.12);
          --color-blue-text:      #7aaee0;
          --radius-sm: 6px;
          --radius-md: 10px;
          --shadow-card: 0 2px 8px rgba(0,0,0,0.4);
        }

        html { font-size: 16px; }

        body {
          background-color: var(--color-bg);
          color: var(--color-text-primary);
          font-family: 'Source Sans 3', sans-serif;
          line-height: 1.6;
          min-height: 100vh;
        }

        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }

        .skip-link {
          position: absolute; top: -100%; left: 1rem;
          background: var(--color-amber-btn-bg);
          color: var(--color-amber-btn-text);
          padding: 0.5rem 1rem; border-radius: var(--radius-sm);
          font-weight: 600; z-index: 100; text-decoration: none;
        }
        .skip-link:focus { top: 1rem; }

        /* ── Header ─────────────────────────────────────────────── */

        .site-header {
          position: relative; z-index: 1;
          border-bottom: 1px solid var(--color-border);
          padding: 0 1.5rem;
        }
        .header-inner {
          max-width: 1100px; margin: 0 auto;
          height: 60px; display: flex;
          align-items: center; justify-content: space-between;
        }
        .logo {
          display: flex; align-items: center;
          gap: 10px; text-decoration: none;
        }
        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: var(--color-text-primary);
        }
        .site-nav { display: flex; gap: 0.25rem; }
        .nav-link {
          font-size: 0.8125rem; color: var(--color-text-muted);
          text-decoration: none; padding: 0.4rem 0.875rem;
          border-radius: var(--radius-sm);
          transition: color 0.15s, background 0.15s; font-weight: 500;
        }
        .nav-link:hover { color: var(--color-text-primary); background: var(--color-surface); }
        .nav-link--active { color: var(--color-amber-text); background: var(--color-amber-subtle); }
        .nav-link:focus-visible { outline: 3px solid var(--color-amber-text); outline-offset: 2px; }

        @media (max-width: 560px) { .nav-link-label { display: none; } }

        /* ── Layout ─────────────────────────────────────────────── */

        .page-wrapper {
          position: relative; z-index: 1;
          padding: 2.5rem 1.5rem 4rem;
        }
        .page-inner { max-width: 1100px; margin: 0 auto; }

        .page-heading { margin-bottom: 2rem; }
        .page-heading h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700; color: var(--color-text-primary);
          line-height: 1.2; margin-bottom: 0.4rem;
        }
        .page-heading__meta {
          display: flex; align-items: center;
          gap: 1rem; flex-wrap: wrap;
        }
        .page-heading p { font-size: 1rem; color: var(--color-text-secondary); font-weight: 300; }

        /* ── Stat grid ──────────────────────────────────────────── */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem; margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          box-shadow: var(--shadow-card);
        }
        .stat-card__label {
          font-size: 0.6875rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-text-muted);
          font-weight: 600; margin-bottom: 0.5rem; display: block;
        }
        .stat-card__value {
          font-family: 'Playfair Display', serif;
          font-size: 1.875rem; font-weight: 700;
          color: var(--color-amber-text); line-height: 1;
        }
        .stat-card__change { font-size: 0.8125rem; margin-top: 0.3rem; }
        .stat-card__sparkline { margin-top: 0.75rem; }

        /* ── Main grid ──────────────────────────────────────────── */

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem; align-items: start;
        }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr; }
        }

        /* ── Cards ──────────────────────────────────────────────── */

        .card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          box-shadow: var(--shadow-card);
          margin-bottom: 1rem;
        }
        .card__title {
          font-family: 'Playfair Display', serif;
          font-size: 1.0625rem; font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 1rem;
        }
        .card__label {
          font-size: 0.6875rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-text-muted);
          font-weight: 600; margin-bottom: 1rem; display: block;
        }

        hr.divider {
          border: none; border-top: 1px solid var(--color-border); margin: 1rem 0;
        }

        /* ── Trend chart ────────────────────────────────────────── */

        .trend-chart {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          height: 80px;
          padding-bottom: 0.25rem;
        }

        .trend-bar-wrap {
          flex: 1; display: flex;
          flex-direction: column;
          align-items: center; gap: 0.375rem;
          height: 100%; justify-content: flex-end;
        }

        .trend-bar-track {
          width: 100%; border-radius: 4px 4px 0 0;
          background: var(--color-amber-btn-bg);
          transition: height 0.4s ease;
          min-height: 4px;
        }

        .trend-bar-track--current { background: var(--color-amber-text); }

        .trend-bar-label {
          font-size: 0.625rem; color: var(--color-text-muted);
          text-align: center; white-space: nowrap;
        }

        .trend-bar-value {
          font-size: 0.625rem; color: var(--color-text-secondary);
          text-align: center;
        }

        /* ── Client table ───────────────────────────────────────── */

        .client-table {
          width: 100%; border-collapse: collapse;
        }

        .client-table th {
          font-size: 0.6875rem; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--color-text-muted);
          font-weight: 600; padding: 0 0 0.625rem;
          text-align: left; border-bottom: 1px solid var(--color-border);
        }
        .client-table th:not(:first-child) { text-align: right; }

        .client-table td {
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-border);
          font-size: 0.875rem; color: var(--color-text-secondary);
          vertical-align: middle;
        }
        .client-table tr:last-child td { border-bottom: none; }
        .client-table td:not(:first-child) { text-align: right; }

        .client-name {
          color: var(--color-text-primary);
          font-size: 0.9375rem;
        }

        /* ── Product rows ───────────────────────────────────────── */

        .product-row {
          display: flex; align-items: center;
          gap: 1rem; padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .product-row:last-child { border-bottom: none; }

        .product-row__name {
          flex: 1; font-size: 0.9375rem; color: var(--color-text-primary);
        }
        .product-row__loaves {
          font-size: 0.875rem; color: var(--color-amber-text); font-weight: 600;
          min-width: 60px; text-align: right;
        }
        .product-row__badge {
          font-size: 0.6875rem; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
          padding: 2px 7px; border-radius: 4px; white-space: nowrap;
        }

        /* ── AI flags ───────────────────────────────────────────── */

        .flag-card {
          border-radius: var(--radius-md);
          border: 1px solid;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }

        .flag-card__header {
          width: 100%; background: none; border: none;
          cursor: pointer; text-align: left;
          padding: 1rem 1.25rem;
          display: flex; align-items: center;
          gap: 0.75rem; transition: opacity 0.15s;
        }
        .flag-card__header:hover { opacity: 0.85; }
        .flag-card__header:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: -3px;
        }

        .flag-card__icon { font-size: 1rem; flex-shrink: 0; line-height: 1; }
        .flag-card__label {
          font-size: 0.6875rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          flex-shrink: 0;
        }
        .flag-card__title {
          font-size: 0.9375rem; color: var(--color-text-primary);
          font-weight: 500; flex: 1; line-height: 1.4;
        }
        .flag-card__chevron {
          font-size: 0.6875rem; color: var(--color-text-muted);
          transition: transform 0.2s; flex-shrink: 0;
        }
        .flag-card__chevron--open { transform: rotate(180deg); }

        .flag-card__body {
          padding: 0 1.25rem 1rem;
          font-size: 0.875rem; color: var(--color-text-secondary);
          line-height: 1.7;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .flag-card__body { animation: slideDown 0.2s ease forwards; }

        /* ── AI narrative ───────────────────────────────────────── */

        .narrative {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.85;
        }

        .narrative p + p { margin-top: 1rem; }

        .narrative strong { color: var(--color-text-primary); font-weight: 600; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }

        /* ── Generating state ───────────────────────────────────── */

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--color-amber-text); flex-shrink: 0;
          animation: pulse 1.4s ease infinite;
        }

        /* ── Buttons ────────────────────────────────────────────── */

        .btn-primary {
          background: var(--color-amber-btn-bg);
          color: var(--color-amber-btn-text);
          border: none; font-family: 'Source Sans 3', sans-serif;
          font-weight: 700; font-size: 0.8125rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.6rem 1.25rem; border-radius: var(--radius-sm);
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          white-space: nowrap; display: inline-flex; align-items: center; gap: 0.5rem;
        }
        .btn-primary:hover:not(:disabled) { background: #D4920F; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary:focus-visible { outline: 3px solid var(--color-amber-text); outline-offset: 2px; }

        .btn-ghost {
          background: transparent; color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.8125rem; padding: 0.6rem 1.25rem;
          border-radius: var(--radius-sm); cursor: pointer;
          transition: border-color 0.15s, color 0.15s; white-space: nowrap;
        }
        .btn-ghost:hover { border-color: var(--color-amber-text); color: var(--color-text-secondary); }
        .btn-ghost:focus-visible { outline: 3px solid var(--color-amber-text); outline-offset: 2px; }

        /* ── Footer ─────────────────────────────────────────────── */

        .page-footer {
          margin-top: 4rem; padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 0.5rem;
        }
        .page-footer p { font-size: 0.75rem; color: var(--color-text-muted); }
      `}</style>

      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="BakeryOps home">
            <span style={{ fontSize: '20px' }} aria-hidden="true">🍞</span>
            <span className="logo-text">BakeryOps</span>
          </a>
          <nav className="site-nav" aria-label="Main navigation">
            <a href="/intake"    className="nav-link"><span className="nav-link-label">Order Intake</span></a>
            <a href="/dashboard" className="nav-link"><span className="nav-link-label">Dashboard</span></a>
            <a href="/report"    className="nav-link nav-link--active" aria-current="page"><span className="nav-link-label">Weekly Report</span></a>
          </nav>
        </div>
      </header>

      {/* ── Page ────────────────────────────────────────────────── */}
      <div className="page-wrapper">
        <div className="page-inner">
          <main id="main-content">

            {/* Heading */}
            <div className="page-heading">
              <h1>Weekly Report</h1>
              <div className="page-heading__meta">
                <p>
                  Week of{' '}
                  <time dateTime="2025-11-04">4 November 2025</time>
                </p>
                <button
                  className="btn-primary"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                >
                  {isGenerating ? (
                    <><span className="pulse-dot" aria-hidden="true" /> Generating…</>
                  ) : (
                    <> ↻ Regenerate report</>
                  )}
                </button>
                <button className="btn-ghost" aria-label="Email report to admin">
                  ✉ Email to admin
                </button>
              </div>
            </div>

            {/* ── Numbers first: stat grid ────────────────────── */}
            <section aria-label="Week at a glance" className="stats-grid">
              <article className="stat-card">
                <span className="stat-card__label">Revenue</span>
                <p className="stat-card__value">{formatCurrency(THIS_WEEK.revenue)}</p>
                <p className="stat-card__change">
                  <TrendArrow value={revenueChange} />
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px', fontSize: '0.75rem' }}>vs last week</span>
                </p>
                <div className="stat-card__sparkline">
                  <Sparkline data={WEEKLY_TREND.map(w => w.revenue)} />
                </div>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Loaves baked</span>
                <p className="stat-card__value">{THIS_WEEK.loaves}</p>
                <p className="stat-card__change">
                  <TrendArrow value={loavesChange} />
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px', fontSize: '0.75rem' }}>vs last week</span>
                </p>
                <div className="stat-card__sparkline">
                  <Sparkline data={WEEKLY_TREND.map(w => w.loaves)} color="#7aaee0" />
                </div>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Gross margin</span>
                <p className="stat-card__value">{margin}%</p>
                <p className="stat-card__change" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {formatCurrency(THIS_WEEK.ingredientCost)} ingredient cost
                </p>
                <div className="stat-card__sparkline">
                  <Sparkline
                    data={WEEKLY_TREND.map(w => parseFloat(((w.revenue - w.ingredientCost) / w.revenue * 100).toFixed(1)))}
                    color="#6DB860"
                  />
                </div>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Active clients</span>
                <p className="stat-card__value">{THIS_WEEK.clients}</p>
                <p className="stat-card__change" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  5 weeks consecutive growth
                </p>
                <div className="stat-card__sparkline">
                  <Sparkline data={WEEKLY_TREND.map(w => w.clients)} color="#9C876F" />
                </div>
              </article>
            </section>

            <div className="main-grid">

              {/* ── Left column ──────────────────────────────── */}
              <div>

                {/* Revenue trend bar chart */}
                <section aria-label="5-week revenue trend" className="card">
                  <h2 className="card__title">5-week revenue trend</h2>
                  <div className="trend-chart" role="img" aria-label="Bar chart showing 5 weeks of revenue">
                    {WEEKLY_TREND.map((w, i) => {
                      const max = Math.max(...WEEKLY_TREND.map(d => d.revenue))
                      const h   = ((w.revenue / max) * 100)
                      const isCurrent = i === WEEKLY_TREND.length - 1
                      return (
                        <div key={w.week} className="trend-bar-wrap">
                          <p className="trend-bar-value">{formatCurrency(w.revenue).replace('CA', '')}</p>
                          <div
                            className={`trend-bar-track ${isCurrent ? 'trend-bar-track--current' : ''}`}
                            style={{ height: `${h}%` }}
                            role="presentation"
                          />
                          <p className="trend-bar-label">{w.week}{isCurrent ? ' ★' : ''}</p>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Top performing clients */}
                <section aria-label="Client performance" className="card">
                  <h2 className="card__title">Client performance</h2>
                  <table className="client-table" aria-label="Client performance this week">
                    <thead>
                      <tr>
                        <th scope="col">Client</th>
                        <th scope="col">Revenue</th>
                        <th scope="col">Loaves</th>
                        <th scope="col">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CLIENT_PERFORMANCE.sort((a, b) => b.revenue - a.revenue).map(client => (
                        <tr key={client.name}>
                          <td>
                            <span className="client-name">{client.name}</span>
                          </td>
                          <td>{formatCurrency(client.revenue)}</td>
                          <td>{client.loaves}</td>
                          <td>
                            <span style={{
                              color: client.trend === 'up' ? 'var(--color-green-text)'
                                : client.trend === 'down' ? 'var(--color-red-text)'
                                : 'var(--color-text-muted)',
                              fontWeight: 600,
                            }}>
                              {client.trend === 'up'     ? `↑ +${client.change}%`
                               : client.trend === 'down' ? `↓ ${client.change}%`
                               : '→'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                {/* Slowest selling products */}
                {slowProducts.length > 0 && (
                  <section aria-label="Products to watch" className="card">
                    <h2 className="card__title">Products to watch</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      These products had slow sell-through this week. Slow sell-through means
                      stock sat on shelves — a signal to review price, volume, or placement.
                    </p>
                    {slowProducts.map(product => (
                      <div key={product.name} className="product-row">
                        <span className="product-row__name">{product.name}</span>
                        <span className="product-row__loaves">{product.loaves} loaves</span>
                        <span
                          className="product-row__badge"
                          style={{
                            background: 'var(--color-red-subtle)',
                            color: 'var(--color-red-text)',
                          }}
                          aria-label={`${product.name}: slow sell-through for ${product.weeksSlowing} week${product.weeksSlowing !== 1 ? 's' : ''}`}
                        >
                          Slow · {product.weeksSlowing}w
                        </span>
                      </div>
                    ))}
                  </section>
                )}

                {/* AI narrative */}
                <section aria-label="AI analysis" className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 className="card__title" style={{ margin: 0 }}>AI analysis</h2>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 600,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--color-amber-text)',
                      background: 'var(--color-amber-subtle)',
                      padding: '3px 8px', borderRadius: '4px',
                    }}>
                      Generated by Claude
                    </span>
                  </div>

                  {isGenerating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                      <div className="pulse-dot" aria-hidden="true" />
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Analysing this week's orders, trends, and feedback signals…
                      </p>
                    </div>
                  )}

                  {!isGenerating && reportVisible && (
                    <div className="fade-up">
                      <article className="narrative" aria-label="AI-generated business narrative">
                        {AI_NARRATIVE.split('\n\n').map((para, i) => (
                          <p key={i}
                            dangerouslySetInnerHTML={{
                              __html: para.replace(
                                /(\$[\d,]+\.?\d*|[\d.]+%|\d+ loaves|\d+ clients|five weeks|47\.5%|72\.4%|8%|14%)/g,
                                '<strong>$1</strong>'
                              )
                            }}
                          />
                        ))}
                      </article>

                      <hr className="divider" />

                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                        <strong style={{ color: 'var(--color-text-muted)' }}>Note:</strong> This analysis
                        is generated from your order data, client feedback, and historical trends.
                        It is a decision-support tool — verify figures against your records before
                        acting on financial recommendations.
                      </p>
                    </div>
                  )}
                </section>

              </div>

              {/* ── Right sidebar ─────────────────────────────── */}
              <aside aria-label="AI flags and product breakdown">

                {/* AI flags */}
                <section aria-label="AI flags" style={{ marginBottom: '1rem' }}>
                  <span className="card__label" style={{ padding: '0 0 0.5rem', display: 'block' }}>
                    AI flags this week
                  </span>

                  {AI_FLAGS.map((flag, i) => {
                    const c       = flagColors[flag.type]
                    const isOpen  = expandedFlag === i
                    return (
                      <article
                        key={i}
                        className="flag-card"
                        style={{ borderColor: c.border, background: c.bg }}
                      >
                        <button
                          className="flag-card__header"
                          onClick={() => setExpandedFlag(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          aria-controls={`flag-body-${i}`}
                        >
                          <span className="flag-card__icon" aria-hidden="true">{c.icon}</span>
                          <span className="flag-card__label" style={{ color: c.border }}>{c.label}</span>
                          <span className="flag-card__title">{flag.title}</span>
                          <span className={`flag-card__chevron ${isOpen ? 'flag-card__chevron--open' : ''}`} aria-hidden="true">▼</span>
                        </button>
                        {isOpen && (
                          <p id={`flag-body-${i}`} className="flag-card__body">
                            {flag.body}
                          </p>
                        )}
                      </article>
                    )
                  })}
                </section>

                {/* Product breakdown */}
                <section aria-label="Product breakdown" className="card">
                  <h2 className="card__title">Product breakdown</h2>
                  <div role="list" aria-label="Revenue and sell-through by product">
                    {PRODUCT_PERFORMANCE.sort((a, b) => b.revenue - a.revenue).map(p => {
                      const badgeStyle = p.sellThrough === 'fast'
                        ? { bg: 'var(--color-amber-subtle)', color: 'var(--color-amber-text)' }
                        : p.sellThrough === 'slow'
                        ? { bg: 'var(--color-red-subtle)',   color: 'var(--color-red-text)' }
                        : { bg: 'var(--color-green-subtle)', color: 'var(--color-green-text)' }
                      return (
                        <div key={p.name} className="product-row" role="listitem">
                          <div style={{ flex: 1 }}>
                            <p className="product-row__name">{p.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {formatCurrency(p.revenue)}
                            </p>
                          </div>
                          <span className="product-row__loaves">{p.loaves}</span>
                          <span
                            className="product-row__badge"
                            style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                          >
                            {p.sellThrough === 'fast' ? '⚡ Fast'
                              : p.sellThrough === 'slow' ? '◎ Slow'
                              : '✓ Normal'}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <hr className="divider" />

                  <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <dt style={{ color: 'var(--color-text-muted)' }}>Total revenue</dt>
                      <dd style={{ color: 'var(--color-amber-text)', fontWeight: 600 }}>
                        {formatCurrency(PRODUCT_PERFORMANCE.reduce((s, p) => s + p.revenue, 0))}
                      </dd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <dt style={{ color: 'var(--color-text-muted)' }}>Top earner</dt>
                      <dd style={{ color: 'var(--color-text-secondary)' }}>
                        {PRODUCT_PERFORMANCE.sort((a, b) => b.revenue - a.revenue)[0].name}
                      </dd>
                    </div>
                  </dl>
                </section>

              </aside>
            </div>
          </main>

          <footer className="page-footer" role="contentinfo">
            <p>BakeryOps — Demand-driven production management</p>
            <p>
              <time dateTime="2025-11-04">4 November 2025</time>
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}