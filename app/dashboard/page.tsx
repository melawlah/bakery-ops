'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type OrderStatus = 'confirmed' | 'pending' | 'fulfilled'

type OrderItem = {
  product: string
  quantity: number
  unitPrice: number
}

type Order = {
  id: string
  client: string
  channel: 'whatsapp' | 'email' | 'sms'
  status: OrderStatus
  items: OrderItem[]
  feedback: {
    sellThroughSpeed: 'fast' | 'normal' | 'slow' | 'unknown'
    sentiment: 'positive' | 'neutral' | 'negative'
    signals: string[]
  }
  aiConfidence: 'high' | 'medium' | 'low'
  needsReview: boolean
  reviewReason: string | null
  receivedAt: string
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    client: 'St. Lawrence Market Grocers',
    channel: 'whatsapp',
    status: 'confirmed',
    items: [
      { product: 'Agege Bread',   quantity: 80, unitPrice: 6.50 },
      { product: 'Sardine Bread', quantity: 45, unitPrice: 5.00 },
      { product: 'Coconut Bread', quantity: 25, unitPrice: 5.50 },
    ],
    feedback: {
      sellThroughSpeed: 'fast',
      sentiment: 'positive',
      signals: ['Sold out by Tuesday both days', 'Customers asking for more agege bread'],
    },
    aiConfidence: 'high',
    needsReview: false,
    reviewReason: null,
    receivedAt: 'Mon 8:14 am',
  },
  {
    id: 'ord-002',
    client: 'Kensington Natural Foods',
    channel: 'email',
    status: 'pending',
    items: [
      { product: 'Agege Bread',   quantity: 40, unitPrice: 6.50 },
      { product: 'Mini Loaves',   quantity: 20, unitPrice: 6.00 },
      { product: 'Coconut Bread', quantity: 30, unitPrice: 5.50 },
    ],
    feedback: {
      sellThroughSpeed: 'normal',
      sentiment: 'neutral',
      signals: ['Steady week, no complaints'],
    },
    aiConfidence: 'medium',
    needsReview: true,
    reviewReason: "'Mini loaves' is not in your current product list — confirm whether you carry this before adding to the order.",
    receivedAt: 'Mon 9:02 am',
  },
  {
    id: 'ord-003',
    client: 'Bloor Street Deli',
    channel: 'sms',
    status: 'confirmed',
    items: [
      { product: 'Agege Bread',   quantity: 30, unitPrice: 6.50 },
      { product: 'Sardine Bread', quantity: 30, unitPrice: 5.00 },
    ],
    feedback: {
      sellThroughSpeed: 'normal',
      sentiment: 'positive',
      signals: ['Happy with the quality', 'Regular customers coming back'],
    },
    aiConfidence: 'high',
    needsReview: false,
    reviewReason: null,
    receivedAt: 'Mon 10:31 am',
  },
  {
    id: 'ord-004',
    client: 'Roncesvalles Village Market',
    channel: 'whatsapp',
    status: 'pending',
    items: [
      { product: 'Agege Bread',   quantity: 55, unitPrice: 6.50 },
      { product: 'Sardine Bread', quantity: 20, unitPrice: 5.50 },
    ],
    feedback: {
      sellThroughSpeed: 'fast',
      sentiment: 'positive',
      signals: ['Agege bread flying out', 'Customers love the crust'],
    },
    aiConfidence: 'medium',
    needsReview: true,
    reviewReason: "Order is 38% above last week's quantity — unusual spike flagged for your awareness.",
    receivedAt: 'Mon 11:47 am',
  },
  {
    id: 'ord-005',
    client: 'The Junction Pantry',
    channel: 'email',
    status: 'fulfilled',
    items: [
      { product: 'Sardine Bread', quantity: 25, unitPrice: 5.00 },
      { product: 'Coconut Bread', quantity: 15, unitPrice: 5.50 },
    ],
    feedback: {
      sellThroughSpeed: 'slow',
      sentiment: 'neutral',
      signals: ['Bit slow this week', 'Long weekend affected foot traffic'],
    },
    aiConfidence: 'high',
    needsReview: false,
    reviewReason: null,
    receivedAt: 'Sun 6:22 pm',
  },
]

const UNIT_PRICES: Record<string, number> = {
  'Agege Bread':   6.50,
  'Sardine Bread': 5.00,
  'Coconut Bread': 5.50,
  'Mini Loaves':   6.00,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function orderRevenue(order: Order) {
  return order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
}

function productionSummary(orders: Order[]) {
  const map: Record<string, number> = {}
  for (const order of orders) {
    if (order.status === 'pending' && order.needsReview) continue
    for (const item of order.items) {
      map[item.product] = (map[item.product] || 0) + item.quantity
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

// ── Small components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const map = {
    confirmed: { label: 'Confirmed',  bg: 'rgba(109,184,96,0.12)',  color: '#6DB860' },
    pending:   { label: 'Needs review', bg: 'rgba(200,134,10,0.12)', color: '#E8A020' },
    fulfilled: { label: 'Fulfilled',  bg: 'rgba(100,150,200,0.12)', color: '#7aaee0' },
  }
  const s = map[status]
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase' as const,
      padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' as const,
    }}>
      {s.label}
    </span>
  )
}

function ChannelIcon({ channel }: { channel: Order['channel'] }) {
  const map = { whatsapp: '💬', email: '✉', sms: '📱' }
  return (
    <span title={channel} aria-label={`Via ${channel}`} style={{ fontSize: '14px' }}>
      {map[channel]}
    </span>
  )
}

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') return <span style={{ color: '#6DB860' }}>↑ Positive</span>
  if (sentiment === 'negative') return <span style={{ color: '#E07070' }}>↓ Negative</span>
  return <span style={{ color: '#9C876F' }}>→ Neutral</span>
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [orders, setOrders]       = useState<Order[]>(MOCK_ORDERS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter]       = useState<'all' | OrderStatus>('all')

  const totalLoaves   = orders.flatMap(o => o.items).reduce((s, i) => s + i.quantity, 0)
  const totalRevenue  = orders.reduce((s, o) => s + orderRevenue(o), 0)
  const reviewCount   = orders.filter(o => o.needsReview && o.status === 'pending').length
  const production    = productionSummary(orders)
  const maxProd       = production.length ? production[0][1] : 1

  const visibleOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const toggleExpand = (id: string) =>
    setExpandedId(prev => prev === id ? null : id)

  const approveOrder = (id: string) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: 'confirmed', needsReview: false } : o
    ))
    setExpandedId(null)
  }

  const rejectOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id))
    setExpandedId(null)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

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
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .skip-link {
          position: absolute; top: -100%; left: 1rem;
          background: var(--color-amber-btn-bg);
          color: var(--color-amber-btn-text);
          padding: 0.5rem 1rem; border-radius: var(--radius-sm);
          font-weight: 600; z-index: 100; text-decoration: none;
        }
        .skip-link:focus { top: 1rem; }

        /* ── Header / Nav ───────────────────────────────────────── */

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
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          text-decoration: none;
          padding: 0.4rem 0.875rem;
          border-radius: var(--radius-sm);
          transition: color 0.15s, background 0.15s;
          font-weight: 500;
        }
        .nav-link:hover {
          color: var(--color-text-primary);
          background: var(--color-surface);
        }
        .nav-link--active {
          color: var(--color-amber-text);
          background: var(--color-amber-subtle);
        }
        .nav-link:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: 2px;
        }

        @media (max-width: 560px) {
          .nav-link-label { display: none; }
        }

        /* ── Page wrapper ───────────────────────────────────────── */

        .page-wrapper {
          position: relative; z-index: 1;
          padding: 2.5rem 1.5rem 4rem;
        }

        .page-inner { max-width: 1100px; margin: 0 auto; }

        /* ── Page heading ───────────────────────────────────────── */

        .page-heading { margin-bottom: 2rem; }

        .page-heading h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700; color: var(--color-text-primary);
          line-height: 1.2; margin-bottom: 0.4rem;
        }

        .page-heading p {
          font-size: 1rem; color: var(--color-text-secondary); font-weight: 300;
        }

        /* ── Summary stats ──────────────────────────────────────── */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
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
          font-size: 2rem; font-weight: 700;
          color: var(--color-amber-text); line-height: 1;
        }

        .stat-card__sub {
          font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.3rem;
        }

        .stat-card--alert .stat-card__value { color: var(--color-red-text); }

        /* ── Main layout ────────────────────────────────────────── */

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 860px) {
          .main-grid { grid-template-columns: 1fr; }
          .sidebar { order: -1; }
        }

        /* ── Filter bar ─────────────────────────────────────────── */

        .filter-bar {
          display: flex; gap: 0.5rem; margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          background: transparent;
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.8125rem; font-weight: 500;
          padding: 0.4rem 1rem;
          border-radius: 20px; cursor: pointer;
          transition: all 0.15s;
        }
        .filter-btn:hover {
          border-color: var(--color-amber-text);
          color: var(--color-text-secondary);
        }
        .filter-btn--active {
          background: var(--color-amber-subtle);
          border-color: var(--color-amber-text);
          color: var(--color-amber-text);
        }
        .filter-btn:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: 2px;
        }

        /* ── Order cards ────────────────────────────────────────── */

        .orders-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .order-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          overflow: hidden;
          transition: border-color 0.15s;
        }

        .order-card:has(.order-card__summary:focus-visible) {
          border-color: var(--color-amber-text);
        }

        .order-card--pending { border-left: 3px solid var(--color-amber-text); }
        .order-card--confirmed { border-left: 3px solid var(--color-green-text); }
        .order-card--fulfilled { border-left: 3px solid var(--color-blue-text); }

        .order-card__summary {
          width: 100%; background: none; border: none;
          cursor: pointer; text-align: left;
          padding: 1.25rem 1.5rem;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.75rem 1rem;
          align-items: center;
        }

        .order-card__summary:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: -3px;
          border-radius: var(--radius-md);
        }

        .order-card__top {
          display: flex; align-items: center;
          gap: 0.625rem; flex-wrap: wrap;
          margin-bottom: 0.375rem;
        }

        .order-card__client {
          font-family: 'Playfair Display', serif;
          font-size: 1rem; color: var(--color-text-primary);
          font-weight: 600;
        }

        .order-card__meta {
          font-size: 0.8125rem; color: var(--color-text-muted);
        }

        .order-card__items {
          font-size: 0.875rem; color: var(--color-text-secondary);
        }

        .order-card__right {
          text-align: right; flex-shrink: 0;
        }

        .order-card__revenue {
          font-family: 'Playfair Display', serif;
          font-size: 1.125rem; color: var(--color-text-primary);
          font-weight: 600;
        }

        .order-card__chevron {
          font-size: 0.75rem; color: var(--color-text-muted);
          margin-top: 0.25rem; transition: transform 0.2s;
          display: block;
        }

        .order-card__chevron--open { transform: rotate(180deg); }

        /* ── Expanded detail ────────────────────────────────────── */

        .order-detail {
          border-top: 1px solid var(--color-border);
          padding: 1.25rem 1.5rem;
          background: var(--color-surface-raised);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .order-detail { animation: slideDown 0.25s ease forwards; }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.25rem;
        }

        @media (max-width: 560px) {
          .detail-grid { grid-template-columns: 1fr; }
        }

        .detail-section__label {
          font-size: 0.6875rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--color-text-muted);
          font-weight: 600; margin-bottom: 0.625rem; display: block;
        }

        .line-items { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }

        .line-item {
          display: flex; justify-content: space-between;
          font-size: 0.875rem; color: var(--color-text-secondary);
          padding: 0.3rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .line-item:last-child { border-bottom: none; }
        .line-item__qty { color: var(--color-amber-text); font-weight: 600; }

        .signals-list { list-style: none; display: flex; flex-direction: column; gap: 0.375rem; }
        .signal {
          font-size: 0.8125rem; color: var(--color-text-muted);
          padding-left: 0.75rem;
          border-left: 2px solid var(--color-border);
          font-style: italic; line-height: 1.5;
        }

        .review-banner {
          background: var(--color-amber-subtle);
          border: 1px solid var(--color-amber-text);
          border-radius: var(--radius-sm);
          padding: 0.875rem 1rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        .review-banner strong {
          color: var(--color-amber-text);
          display: block; margin-bottom: 0.25rem;
          font-size: 0.8125rem; letter-spacing: 0.04em;
        }

        .detail-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; }

        /* ── Buttons ────────────────────────────────────────────── */

        .btn-primary {
          background: var(--color-amber-btn-bg);
          color: var(--color-amber-btn-text);
          border: none; font-family: 'Source Sans 3', sans-serif;
          font-weight: 700; font-size: 0.8125rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.6rem 1.25rem; border-radius: var(--radius-sm);
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #D4920F; transform: translateY(-1px); }
        .btn-primary:focus-visible { outline: 3px solid var(--color-amber-text); outline-offset: 2px; }

        .btn-secondary {
          background: transparent; color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.8125rem; padding: 0.6rem 1.25rem;
          border-radius: var(--radius-sm); cursor: pointer;
          transition: border-color 0.15s, color 0.15s; white-space: nowrap;
        }
        .btn-secondary:hover { border-color: var(--color-red-text); color: var(--color-red-text); }
        .btn-secondary:focus-visible { outline: 3px solid var(--color-amber-text); outline-offset: 2px; }

        /* ── Sidebar ────────────────────────────────────────────── */

        .sidebar-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          box-shadow: var(--shadow-card);
          margin-bottom: 1rem;
        }

        .sidebar-card__title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem; color: var(--color-text-primary);
          margin-bottom: 1rem; font-weight: 600;
        }

        .prod-list { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }

        .prod-item__header {
          display: flex; justify-content: space-between;
          align-items: baseline; margin-bottom: 0.3rem;
        }

        .prod-item__name { font-size: 0.875rem; color: var(--color-text-secondary); }
        .prod-item__qty  { font-size: 0.875rem; color: var(--color-amber-text); font-weight: 600; }

        .prod-bar-track {
          height: 5px; background: var(--color-surface-raised);
          border-radius: 3px; overflow: hidden;
        }

        .prod-bar-fill {
          height: 100%; background: var(--color-amber-btn-bg);
          border-radius: 3px; transition: width 0.4s ease;
        }

        .prod-item__mixes {
          font-size: 0.6875rem; color: var(--color-text-muted);
          margin-top: 0.2rem;
        }

        hr.divider {
          border: none; border-top: 1px solid var(--color-border); margin: 1rem 0;
        }

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

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <a href="/" className="logo" aria-label="BakeryOps home">
            <span style={{ fontSize: '20px' }} aria-hidden="true">🍞</span>
            <span className="logo-text">BakeryOps</span>
          </a>
          <nav className="site-nav" aria-label="Main navigation">
            <a href="/intake" className="nav-link">
              <span className="nav-link-label">Order Intake</span>
            </a>
            <a href="/dashboard" className="nav-link nav-link--active" aria-current="page">
              <span className="nav-link-label">Dashboard</span>
            </a>
            <a href="/report" className="nav-link">
              <span className="nav-link-label">Weekly Report</span>
            </a>
          </nav>
        </div>
      </header>

      {/* ── Page ──────────────────────────────────────────────────── */}
      <div className="page-wrapper">
        <div className="page-inner">
          <main id="main-content">

            {/* Heading */}
            <div className="page-heading">
              <h1>Orders Dashboard</h1>
              <p>
                Week of{' '}
                <time dateTime={new Date().toISOString().split('T')[0]}>
                  {new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
                {reviewCount > 0 && (
                  <> — <strong style={{ color: 'var(--color-amber-text)' }}>{reviewCount} order{reviewCount > 1 ? 's' : ''} need{reviewCount === 1 ? 's' : ''} your review</strong></>
                )}
              </p>
            </div>

            {/* Summary stats */}
            <section aria-label="Week summary" className="stats-grid">
              <article className="stat-card">
                <span className="stat-card__label">Total loaves this week</span>
                <p className="stat-card__value" aria-label={`${totalLoaves} loaves`}>
                  {totalLoaves.toLocaleString()}
                </p>
                <p className="stat-card__sub">across {orders.length} clients</p>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Estimated revenue</span>
                <p className="stat-card__value" aria-label={`Estimated revenue ${formatCurrency(totalRevenue)}`}>
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="stat-card__sub">pending approvals not included</p>
              </article>

              {reviewCount > 0 && (
                <article className="stat-card stat-card--alert">
                  <span className="stat-card__label">Awaiting review</span>
                  <p className="stat-card__value" aria-label={`${reviewCount} orders need review`}>
                    {reviewCount}
                  </p>
                  <p className="stat-card__sub">orders need your attention</p>
                </article>
              )}
            </section>

            {/* Main grid: orders + sidebar */}
            <div className="main-grid">

              {/* ── Orders list ──────────────────────────────────── */}
              <section aria-label="Orders list">

                {/* Filter */}
                <div className="filter-bar" role="group" aria-label="Filter orders by status">
                  {(['all', 'pending', 'confirmed', 'fulfilled'] as const).map(f => (
                    <button
                      key={f}
                      className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                      onClick={() => setFilter(f)}
                      aria-pressed={filter === f}
                    >
                      {f === 'all' ? `All (${orders.length})` :
                       f === 'pending' ? `Needs review (${orders.filter(o => o.status === 'pending').length})` :
                       f === 'confirmed' ? `Confirmed (${orders.filter(o => o.status === 'confirmed').length})` :
                       `Fulfilled (${orders.filter(o => o.status === 'fulfilled').length})`}
                    </button>
                  ))}
                </div>

                {/* Cards */}
                <ol className="orders-list" aria-label="Order cards">
                  {visibleOrders.map(order => {
                    const isOpen    = expandedId === order.id
                    const revenue   = orderRevenue(order)
                    const loaves    = order.items.reduce((s, i) => s + i.quantity, 0)
                    const itemSummary = order.items.map(i => `${i.quantity} ${i.product}`).join(', ')

                    return (
                      <li key={order.id} className={`order-card order-card--${order.status}`}>

                        {/* Summary row — clickable */}
                        <button
                          className="order-card__summary"
                          onClick={() => toggleExpand(order.id)}
                          aria-expanded={isOpen}
                          aria-controls={`detail-${order.id}`}
                        >
                          <div>
                            <div className="order-card__top">
                              <span className="order-card__client">{order.client}</span>
                              <ChannelIcon channel={order.channel} />
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="order-card__meta">
                              {loaves} loaves · {itemSummary} · Received {order.receivedAt}
                            </p>
                          </div>
                          <div className="order-card__right">
                            <p className="order-card__revenue">{formatCurrency(revenue)}</p>
                            <span
                              className={`order-card__chevron ${isOpen ? 'order-card__chevron--open' : ''}`}
                              aria-hidden="true"
                            >
                              ▼
                            </span>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isOpen && (
                          <div
                            id={`detail-${order.id}`}
                            className="order-detail"
                            role="region"
                            aria-label={`Details for ${order.client}`}
                          >
                            {/* Review banner */}
                            {order.needsReview && order.status === 'pending' && (
                              <div className="review-banner" role="alert">
                                <strong>⚠ Needs your review</strong>
                                {order.reviewReason}
                              </div>
                            )}

                            <div className="detail-grid">
                              {/* Line items */}
                              <div>
                                <span className="detail-section__label">Order items</span>
                                <ul className="line-items" aria-label="Order line items">
                                  {order.items.map((item, i) => (
                                    <li key={i} className="line-item">
                                      <span>{item.product}</span>
                                      <span>
                                        <span className="line-item__qty">{item.quantity}</span>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                                          {' '}loaves · {formatCurrency(item.quantity * item.unitPrice)}
                                        </span>
                                      </span>
                                    </li>
                                  ))}
                                  <li className="line-item" style={{ fontWeight: 600 }}>
                                    <span style={{ color: 'var(--color-text-primary)' }}>Total</span>
                                    <span style={{ color: 'var(--color-amber-text)' }}>{formatCurrency(revenue)}</span>
                                  </li>
                                </ul>
                              </div>

                              {/* Feedback */}
                              <div>
                                <span className="detail-section__label">Client feedback</span>
                                <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                  <div>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Sentiment</p>
                                    <p style={{ fontSize: '0.875rem' }}><SentimentIcon sentiment={order.feedback.sentiment} /></p>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Sell-through</p>
                                    <p style={{ fontSize: '0.875rem', color: order.feedback.sellThroughSpeed === 'fast' ? 'var(--color-amber-text)' : order.feedback.sellThroughSpeed === 'slow' ? 'var(--color-red-text)' : 'var(--color-green-text)' }}>
                                      {order.feedback.sellThroughSpeed === 'fast' ? '⚡ Fast' : order.feedback.sellThroughSpeed === 'slow' ? '◎ Slow' : '✓ Normal'}
                                    </p>
                                  </div>
                                </div>
                                {order.feedback.signals.length > 0 && (
                                  <ul className="signals-list" aria-label="Feedback signals">
                                    {order.feedback.signals.map((s, i) => (
                                      <li key={i} className="signal">"{s}"</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            {order.needsReview && order.status === 'pending' && (
                              <div className="detail-actions">
                                <button
                                  className="btn-primary"
                                  onClick={() => approveOrder(order.id)}
                                  aria-label={`Approve order from ${order.client}`}
                                >
                                  Approve & confirm
                                </button>
                                <button
                                  className="btn-secondary"
                                  onClick={() => rejectOrder(order.id)}
                                  aria-label={`Reject order from ${order.client}`}
                                >
                                  Reject order
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>

                {visibleOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', marginBottom: '0.4rem' }}>
                      No orders here
                    </p>
                    <p style={{ fontSize: '0.875rem' }}>Try a different filter</p>
                  </div>
                )}
              </section>

              {/* ── Sidebar ──────────────────────────────────────── */}
              <aside className="sidebar" aria-label="Production summary">
                <section className="sidebar-card">
                  <h2 className="sidebar-card__title">Production this week</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Confirmed orders only. Pending review excluded until approved.
                  </p>
                  <ul className="prod-list" aria-label="Loaves per product">
                    {production.map(([product, qty]) => {
                      const mixYield = 15
                      const mixes    = Math.ceil(qty / mixYield)
                      return (
                        <li key={product}>
                          <div className="prod-item__header">
                            <span className="prod-item__name">{product}</span>
                            <span className="prod-item__qty" aria-label={`${qty} loaves`}>{qty}</span>
                          </div>
                          <div
                            className="prod-bar-track"
                            role="progressbar"
                            aria-valuenow={qty}
                            aria-valuemax={maxProd}
                            aria-label={`${product}: ${qty} of ${maxProd} loaves`}
                          >
                            <div
                              className="prod-bar-fill"
                              style={{ width: `${(qty / maxProd) * 100}%` }}
                            />
                          </div>
                          <p className="prod-item__mixes">{mixes} mix{mixes !== 1 ? 'es' : ''} · {mixYield} loaves/mix</p>
                        </li>
                      )
                    })}
                  </ul>

                  <hr className="divider" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total confirmed</span>
                    <span style={{ color: 'var(--color-amber-text)', fontWeight: 600 }}>
                      {production.reduce((s, [, q]) => s + q, 0)} loaves
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.4rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total mixes</span>
                    <span style={{ color: 'var(--color-amber-text)', fontWeight: 600 }}>
                      {production.reduce((s, [, q]) => s + Math.ceil(q / 15), 0)} mixes
                    </span>
                  </div>
                </section>

                <section className="sidebar-card">
                  <h2 className="sidebar-card__title">This week at a glance</h2>
                  <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { label: 'Orders received',   value: orders.length },
                      { label: 'Auto-confirmed',     value: orders.filter(o => !o.needsReview).length },
                      { label: 'Needs review',       value: reviewCount, alert: reviewCount > 0 },
                      { label: 'Fulfilled',          value: orders.filter(o => o.status === 'fulfilled').length },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <dt style={{ color: 'var(--color-text-muted)' }}>{row.label}</dt>
                        <dd style={{ color: row.alert ? 'var(--color-amber-text)' : 'var(--color-text-secondary)', fontWeight: 600 }}>
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </aside>

            </div>
          </main>

          <footer className="page-footer" role="contentinfo">
            <p>BakeryOps — Demand-driven production management</p>
            <p>
              <time dateTime={new Date().toISOString().split('T')[0]}>
                {new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}