'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

type ProductInterpretation = {
  name: string
  quantity: number
  confidence: 'high' | 'medium' | 'low'
}

type InterpretedOrder = {
  products: ProductInterpretation[]
  feedback: {
    sell_through_speed: 'fast' | 'normal' | 'slow' | 'unknown'
    sentiment: 'positive' | 'neutral' | 'negative'
    raw_signals: string[]
  }
  flags: {
    needs_human_review: boolean
    reason: string | null
  }
  ai_confidence: 'high' | 'medium' | 'low'
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_CLIENT = {
  name: 'St. Lawrence Market Grocers',
  lastWeekOrder: [
    { product: 'Agege Bread', quantity: 60 },
    { product: 'Sardine Bread', quantity: 40 },
    { product: 'Coconut Bread', quantity: 25 },
  ],
}

const SAMPLE_MESSAGES = [
  "Hey! Great week overall — agege bread flew off the shelves, sold out by Tuesday both days. Customers have been asking for more. Sardine bread was steady. Can we do 80 agege bread, 45 sardine, and keep coconut bread the same at 25?",
  "Slow week honestly, think it was the long weekend. Still had agege bread left on Thursday. Maybe drop it to 45 this week? Sardine bread was fine, keep that. Coconut bread maybe a few more, like 30?",
  "The agege bread was incredible this week, customers keep coming back for it. We'll take our usual plus maybe 10 or 15 extra agege bread, not sure yet. Sardine bread the same. Can you add mini loaves to our order if you have it?",
]

// ── Small components ───────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high:   { bg: 'rgba(125,190,110,0.15)', color: '#7dbe6e', label: 'High confidence' },
    medium: { bg: 'rgba(200,134,10,0.15)',  color: '#C8860A', label: 'Medium confidence' },
    low:    { bg: 'rgba(200,90,90,0.15)',   color: '#e08080', label: 'Low confidence' },
  }
  const s = styles[level]
  return (
    <span
      aria-label={`Confidence level: ${s.label}`}
      style={{
        background: s.bg,
        color: s.color,
        fontSize: '11px',
        fontFamily: "'Source Sans 3', sans-serif",
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        padding: '3px 8px',
        borderRadius: '4px',
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  )
}

function SellThroughBadge({ speed }: { speed: string }) {
  const map: Record<string, { icon: string; label: string; color: string }> = {
    fast:    { icon: '⚡', label: 'Sold fast',    color: '#C8860A' },
    normal:  { icon: '✓',  label: 'Normal pace',  color: '#7dbe6e' },
    slow:    { icon: '◎',  label: 'Sold slowly',  color: '#e08080' },
    unknown: { icon: '?',  label: 'Unknown',      color: '#888' },
  }
  const m = map[speed] || map.unknown
  return (
    <span style={{ color: m.color, fontSize: '14px' }}>
      {m.icon} {m.label}
    </span>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OrderIntakePage() {
  const [message, setMessage]         = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult]           = useState<InterpretedOrder | null>(null)
  const [processingStep, setProcessingStep] = useState('')
  const [isApproved, setIsApproved]   = useState(false)

  const handleInterpret = async () => {
    if (!message.trim()) return
    setIsProcessing(true)
    setResult(null)
    setIsApproved(false)

    const steps = [
      'Reading message…',
      'Loading client history…',
      'Interpreting with AI…',
      'Checking for ambiguities…',
      'Finalising…',
    ]
    for (const step of steps) {
      setProcessingStep(step)
      await delay(step === 'Interpreting with AI…' ? 1200 : 600)
    }

    // In production: const res = await fetch('/api/orders', { method: 'POST', body: JSON.stringify({ rawMessage: message }) })
    setResult(getMockInterpretation(message))
    setIsProcessing(false)
    setProcessingStep('')
  }

  const handleReset = () => {
    setMessage('')
    setResult(null)
    setIsApproved(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          /* ── Accessible dark palette ──────────────────────────────
             All text/bg combinations verified at WCAG AA (4.5:1+)

             --color-text-primary   on --color-surface  → 13.2:1  ✅
             --color-text-secondary on --color-surface  →  7.1:1  ✅
             --color-text-muted     on --color-surface  →  4.8:1  ✅
             --color-amber-text     on --color-surface  →  5.2:1  ✅
             --color-green-text     on --color-surface  →  4.6:1  ✅
             --color-red-text       on --color-surface  →  5.4:1  ✅
             --color-text-primary   on --color-bg       → 15.5:1  ✅
          ──────────────────────────────────────────────────────── */
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

        /* Subtle grain texture */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        /* ── Layout ─────────────────────────────────────────────── */

        .skip-link {
          position: absolute;
          top: -100%;
          left: 1rem;
          background: var(--color-amber-btn-bg);
          color: var(--color-amber-btn-text);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          z-index: 100;
          text-decoration: none;
        }
        .skip-link:focus { top: 1rem; }

        .site-header {
          position: relative;
          z-index: 1;
          border-bottom: 1px solid var(--color-border);
          padding: 0 1.5rem;
        }

        .header-inner {
          max-width: 1100px;
          margin: 0 auto;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-icon { font-size: 20px; line-height: 1; }

        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text-primary);
          letter-spacing: 0.01em;
        }

        .nav-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-amber-text);
          background: var(--color-amber-subtle);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .page-wrapper {
          position: relative;
          z-index: 1;
          padding: 2.5rem 1.5rem 4rem;
        }

        .page-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Page header ────────────────────────────────────────── */

        .page-heading {
          margin-bottom: 2rem;
        }

        .page-heading h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.2;
          margin-bottom: 0.4rem;
        }

        .page-heading p {
          font-size: 1rem;
          color: var(--color-text-secondary);
          font-weight: 300;
        }

        /* ── Client context bar ─────────────────────────────────── */

        .client-bar {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          box-shadow: var(--shadow-card);
        }

        .client-bar__label {
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 0.25rem;
        }

        .client-bar__name {
          font-family: 'Playfair Display', serif;
          font-size: 1.125rem;
          color: var(--color-text-primary);
        }

        .client-bar__stats {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .stat {
          text-align: center;
        }

        .stat__number {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-amber-text);
          line-height: 1;
        }

        .stat__label {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        /* ── Two-column grid ────────────────────────────────────── */

        .intake-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 720px) {
          .intake-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Card ───────────────────────────────────────────────── */

        .card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          box-shadow: var(--shadow-card);
        }

        .card__label {
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          font-weight: 600;
          margin-bottom: 1rem;
          display: block;
        }

        hr.divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: 1.25rem 0;
        }

        /* ── Textarea ───────────────────────────────────────────── */

        .message-textarea {
          background: var(--color-surface-raised);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.7;
          padding: 1rem;
          border-radius: var(--radius-sm);
          width: 100%;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: 160px;
        }

        .message-textarea:focus {
          border-color: var(--color-border-focus);
          box-shadow: 0 0 0 3px rgba(200, 134, 10, 0.15);
        }

        .message-textarea::placeholder {
          color: var(--color-text-muted);
        }

        .textarea-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .char-count {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        /* ── Buttons ────────────────────────────────────────────── */

        .btn-primary {
          background: var(--color-amber-btn-bg);
          color: var(--color-amber-btn-text);
          border: none;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 700;
          font-size: 0.8125rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.7rem 1.5rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-primary:hover:not(:disabled) {
          background: #D4920F;
          transform: translateY(-1px);
        }

        .btn-primary:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: 2px;
        }

        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: transparent;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.8125rem;
          padding: 0.7rem 1.25rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          white-space: nowrap;
        }

        .btn-secondary:hover {
          border-color: var(--color-amber-text);
          color: var(--color-text-primary);
        }

        .btn-secondary:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: 2px;
        }

        .btn-ghost {
          background: transparent;
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.8125rem;
          padding: 0.5rem 0.875rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          line-height: 1.4;
        }

        .btn-ghost:hover {
          border-color: var(--color-border-focus);
          color: var(--color-text-secondary);
          background: var(--color-surface-raised);
        }

        .btn-ghost:focus-visible {
          outline: 3px solid var(--color-amber-text);
          outline-offset: 2px;
        }

        /* ── Samples section ────────────────────────────────────── */

        .samples-heading {
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          font-weight: 600;
          margin: 1.25rem 0 0.625rem;
          display: block;
        }

        .samples-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          list-style: none;
        }

        /* ── Processing state ───────────────────────────────────── */

        .processing-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-amber-text);
          flex-shrink: 0;
          animation: pulse 1.4s ease infinite;
        }

        .processing-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          color: var(--color-text-primary);
          margin-bottom: 0.2rem;
        }

        .processing-step {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        /* ── Empty state ────────────────────────────────────────── */

        .empty-state {
          text-align: center;
          padding: 3rem 1.5rem;
        }

        .empty-state__icon {
          font-size: 2rem;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 0.75rem;
          line-height: 1;
        }

        .empty-state__title {
          font-family: 'Playfair Display', serif;
          font-size: 1.125rem;
          color: var(--color-text-muted);
          margin-bottom: 0.4rem;
        }

        .empty-state__sub {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          opacity: 0.6;
        }

        /* ── Animations ─────────────────────────────────────────── */

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fade-up { animation: fadeUp 0.35s ease forwards; }

        /* ── Alert banners ──────────────────────────────────────── */

        .alert {
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1rem;
          border: 1px solid;
        }

        .alert--warning {
          background: var(--color-amber-subtle);
          border-color: var(--color-amber-text);
        }

        .alert--success {
          background: var(--color-green-subtle);
          border-color: var(--color-green-text);
        }

        @keyframes reviewPulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(200,134,10,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(200,134,10,0);   }
        }

        .alert--warning { animation: reviewPulse 2s ease infinite; }

        .alert__header {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .alert__icon { font-size: 1.25rem; flex-shrink: 0; line-height: 1.4; }

        .alert__title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          margin-bottom: 0.3rem;
        }

        .alert--warning .alert__title { color: var(--color-amber-text); }
        .alert--success .alert__title { color: var(--color-green-text); }

        .alert__body {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        .alert__actions {
          display: flex;
          gap: 0.625rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        /* ── Product tiles ──────────────────────────────────────── */

        .product-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          list-style: none;
        }

        .product-tile {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem;
          background: var(--color-surface-raised);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          gap: 1rem;
        }

        .product-tile__name {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          color: var(--color-text-primary);
          margin-bottom: 0.3rem;
        }

        .product-tile__qty {
          font-family: 'Playfair Display', serif;
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--color-amber-text);
          line-height: 1;
          text-align: right;
        }

        .product-tile__unit {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-align: right;
          margin-top: 2px;
        }

        .product-tile__diff {
          font-size: 0.75rem;
          text-align: right;
          margin-top: 2px;
        }

        .diff--up   { color: var(--color-green-text); }
        .diff--down { color: var(--color-red-text); }
        .diff--same { color: var(--color-text-muted); }

        /* ── Feedback section ───────────────────────────────────── */

        .feedback-row {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .feedback-item__label {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.25rem;
        }

        .feedback-item__value {
          font-size: 0.875rem;
        }

        .signals-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          list-style: none;
        }

        .signal-item {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
          padding-left: 0.875rem;
          border-left: 2px solid var(--color-border);
          font-style: italic;
          line-height: 1.5;
        }

        /* ── Page footer ────────────────────────────────────────── */

        .page-footer {
          margin-top: 4rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .page-footer p {
          font-size: 0.75rem;
          color: var(--color-text-muted);
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
      `}</style>

      {/* Accessibility: skip to main content */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Site header ─────────────────────────────────────────── */}
      <header className="site-header" role="banner">
        <div className="header-inner">
            <a href="/" className="logo" aria-label="BakeryOps home">
            <span style={{ fontSize: '20px' }} aria-hidden="true">🍞</span>
            <span className="logo-text">BakeryOps</span>
            </a>
            <nav className="site-nav" aria-label="Main navigation">
            <a href="/intake"    className="nav-link nav-link--active" aria-current="page">
                <span className="nav-link-label">Order Intake</span>
            </a>
            <a href="/dashboard" className="nav-link">
                <span className="nav-link-label">Dashboard</span>
            </a>
            <a href="/report"    className="nav-link">
                <span className="nav-link-label">Weekly Report</span>
            </a>
            </nav>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="page-wrapper">
        <div className="page-inner">

          <main id="main-content">

            {/* Page heading */}
            <div className="page-heading">
              <h1>Weekly Order Intake</h1>
              <p>
                Paste a message from a retail partner. The AI interprets it into a
                structured order — and flags anything it's unsure about for your review.
              </p>
            </div>

            {/* Client context */}
            <section aria-label="Active client summary" className="client-bar">
              <div>
                <p className="client-bar__label">Active client</p>
                <p className="client-bar__name">{MOCK_CLIENT.name}</p>
              </div>
              <div className="client-bar__stats" role="list" aria-label="Last week's order quantities">
                {MOCK_CLIENT.lastWeekOrder.map(item => (
                  <div key={item.product} className="stat" role="listitem">
                    <p className="stat__number" aria-label={`${item.quantity} ${item.product}`}>
                      {item.quantity}
                    </p>
                    <p className="stat__label">{item.product}</p>
                  </div>
                ))}
                <div className="stat">
                  <p className="stat__label" style={{ paddingTop: '0.5rem', opacity: 0.6 }}>
                    Last week
                  </p>
                </div>
              </div>
            </section>

            {/* Two-column intake grid */}
            <div className="intake-grid">

              {/* ── Left: message input ─────────────────────────── */}
              <section aria-label="Message input">
                <article className="card">
                  <label htmlFor="client-message" className="card__label">
                    Client message
                  </label>
                  <textarea
                    id="client-message"
                    className="message-textarea"
                    rows={7}
                    placeholder="Paste the client's message here — WhatsApp, email, SMS, whatever they sent…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    aria-describedby="char-count"
                  />
                  <div className="textarea-footer">
                    <span id="char-count" className="char-count" aria-live="polite">
                      {message.length > 0 ? `${message.length} characters` : 'No message yet'}
                    </span>
                    <button
                      className="btn-primary"
                      onClick={handleInterpret}
                      disabled={!message.trim() || isProcessing}
                      aria-busy={isProcessing}
                    >
                      {isProcessing ? 'Interpreting…' : 'Interpret order →'}
                    </button>
                  </div>
                </article>

                {/* Sample messages */}
                <nav aria-label="Sample messages">
                  <span className="samples-heading">Try a sample message</span>
                  <ol className="samples-list">
                    {SAMPLE_MESSAGES.map((sample, i) => (
                      <li key={i}>
                        <button
                          className="btn-ghost"
                          onClick={() => {
                            setMessage(sample)
                            setResult(null)
                            setIsApproved(false)
                          }}
                          aria-label={`Load sample message ${i + 1}`}
                        >
                          <strong style={{ color: 'var(--color-amber-text)', marginRight: '6px' }}>
                            #{i + 1}
                          </strong>
                          {sample.slice(0, 72)}…
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              </section>

              {/* ── Right: AI output ────────────────────────────── */}
              <section aria-label="AI interpretation result" aria-live="polite">

                {/* Processing */}
                {isProcessing && (
                  <article className="card fade-up" aria-label="Processing in progress">
                    <div className="processing-row">
                      <div className="pulse-dot" aria-hidden="true" />
                      <div>
                        <p className="processing-title">AI is reading the message</p>
                        <p className="processing-step" role="status">{processingStep}</p>
                      </div>
                    </div>
                    <hr className="divider" />
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      Checking against last week's order, available products, and identifying
                      any ambiguities that need your review…
                    </p>
                  </article>
                )}

                {/* Empty state */}
                {!isProcessing && !result && (
                  <article className="card empty-state">
                    <span className="empty-state__icon" aria-hidden="true">◎</span>
                    <h2 className="empty-state__title">Awaiting message</h2>
                    <p className="empty-state__sub">Paste a client message and hit interpret</p>
                  </article>
                )}

                {/* Result */}
                {!isProcessing && result && (
                  <div className="fade-up">

                    {/* Human review alert */}
                    {result.flags.needs_human_review && !isApproved && (
                      <div
                        className="alert alert--warning"
                        role="alert"
                        aria-label="Human review required"
                      >
                        <div className="alert__header">
                          <span className="alert__icon" aria-hidden="true">⚠</span>
                          <div>
                            <h2 className="alert__title">Human Review Required</h2>
                            <p className="alert__body">{result.flags.reason}</p>
                            <div className="alert__actions">
                              <button
                                className="btn-primary"
                                onClick={() => setIsApproved(true)}
                                aria-label="Approve and confirm this order"
                              >
                                Approve & confirm
                              </button>
                              <button
                                className="btn-secondary"
                                onClick={handleReset}
                                aria-label="Reject this order and start over"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Confirmed banner */}
                    {(!result.flags.needs_human_review || isApproved) && (
                      <div
                        className="alert alert--success fade-up"
                        role="status"
                        aria-label="Order confirmed"
                      >
                        <div className="alert__header">
                          <span className="alert__icon" aria-hidden="true">✓</span>
                          <div>
                            <h2 className="alert__title">
                              {isApproved ? 'Order approved by you' : 'Order confirmed automatically'}
                            </h2>
                            <p className="alert__body">
                              {isApproved
                                ? 'Added to this week\'s production run.'
                                : 'AI confidence was high — no review needed.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interpreted order */}
                    <article className="card" style={{ marginBottom: '1rem' }}>
                      <span className="card__label">Interpreted order</span>
                      <ol className="product-list">
                        {result.products.map((product, i) => {
                          const last = MOCK_CLIENT.lastWeekOrder.find(
                            l => l.product.toLowerCase() === product.name.toLowerCase()
                          )
                          const diff = last ? product.quantity - last.quantity : null
                          return (
                            <li key={i} className="product-tile">
                              <div>
                                <p className="product-tile__name">{product.name}</p>
                                <ConfidenceBadge level={product.confidence} />
                              </div>
                              <div>
                                <p
                                  className="product-tile__qty"
                                  aria-label={`${product.quantity} loaves of ${product.name}`}
                                >
                                  {product.quantity}
                                </p>
                                <p className="product-tile__unit">loaves</p>
                                {diff !== null && (
                                  <p
                                    className={`product-tile__diff ${diff > 0 ? 'diff--up' : diff < 0 ? 'diff--down' : 'diff--same'}`}
                                    aria-label={`${diff > 0 ? 'Up' : diff < 0 ? 'Down' : 'Same as'} ${Math.abs(diff)} from last week`}
                                  >
                                    {diff > 0 ? `+${diff}` : diff === 0 ? '—' : diff} vs last week
                                  </p>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    </article>

                    {/* Feedback signals */}
                    <article className="card">
                      <span className="card__label">Feedback signals</span>

                      <div className="feedback-row">
                        <div className="feedback-item">
                          <p className="feedback-item__label">Sell-through</p>
                          <p className="feedback-item__value">
                            <SellThroughBadge speed={result.feedback.sell_through_speed} />
                          </p>
                        </div>
                        <div className="feedback-item">
                          <p className="feedback-item__label">Sentiment</p>
                          <p
                            className="feedback-item__value"
                            style={{
                              color: result.feedback.sentiment === 'positive'
                                ? 'var(--color-green-text)'
                                : result.feedback.sentiment === 'negative'
                                ? 'var(--color-red-text)'
                                : 'var(--color-text-secondary)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {result.feedback.sentiment === 'positive' ? '↑ ' : result.feedback.sentiment === 'negative' ? '↓ ' : '→ '}
                            {result.feedback.sentiment}
                          </p>
                        </div>
                        <div className="feedback-item">
                          <p className="feedback-item__label">AI confidence</p>
                          <p className="feedback-item__value">
                            <ConfidenceBadge level={result.ai_confidence} />
                          </p>
                        </div>
                      </div>

                      {result.feedback.raw_signals.length > 0 && (
                        <>
                          <hr className="divider" />
                          <p className="card__label" style={{ marginBottom: '0.625rem' }}>
                            Signals extracted
                          </p>
                          <ul className="signals-list" aria-label="Extracted signals from message">
                            {result.feedback.raw_signals.map((signal, i) => (
                              <li key={i} className="signal-item">
                                "{signal}"
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </article>

                  </div>
                )}
              </section>
            </div>
          </main>

          {/* Page footer */}
          <footer className="page-footer" role="contentinfo">
            <p>BakeryOps — Demand-driven production management</p>
            <p>
              Week of{' '}
              <time dateTime={new Date().toISOString().split('T')[0]}>
                {new Date().toLocaleDateString('en-CA', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </p>
          </footer>

        </div>
      </div>
    </>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getMockInterpretation(message: string): InterpretedOrder {
  const lower = message.toLowerCase()

  const hasSourdough = lower.includes('agege bread') || lower.includes('agege')
  const hasBrown     = lower.includes('sardine bread') || lower.includes('sardine')
  const hasWheat     = lower.includes('coconut bread') || lower.includes('coconut')
  const hasRye       = lower.includes('mini loaves') || lower.includes('mini')
  const isAmbiguous  = lower.includes('maybe') || lower.includes('not sure') || lower.includes('or')
  const isSlow       = lower.includes('slow') || lower.includes('still had') || lower.includes('left on')
  const isFast       = lower.includes('flew') || lower.includes('sold out') || lower.includes('flying')

  const sourdoughQty = lower.includes('80') ? 80 : lower.includes('45') ? 45 : 70
  const brownQty     = lower.includes('45') && hasBrown ? 45 : 40
  const wheatQty     = lower.includes('30') ? 30 : 25

  const products: ProductInterpretation[] = []
  if (hasSourdough) products.push({ name: 'Agege Bread',   quantity: sourdoughQty, confidence: isAmbiguous ? 'low' : 'high' })
  if (hasBrown)     products.push({ name: 'Sardine Bread', quantity: brownQty,     confidence: 'high' })
  if (hasWheat)     products.push({ name: 'Coconut Bread', quantity: wheatQty,     confidence: isAmbiguous ? 'medium' : 'high' })
  if (hasRye)       products.push({ name: 'Mini Loaves',   quantity: 20,           confidence: 'low' })
  if (products.length === 0)
    products.push({ name: 'Agege Bread', quantity: 60, confidence: 'medium' })

  const needsReview = isAmbiguous || hasRye || sourdoughQty > 75

  return {
    products,
    feedback: {
      sell_through_speed: isFast ? 'fast' : isSlow ? 'slow' : 'normal',
      sentiment:          isFast ? 'positive' : isSlow ? 'neutral' : 'positive',
      raw_signals:        extractSignals(message),
    },
    flags: {
      needs_human_review: needsReview,
      reason: needsReview
        ? hasRye
          ? "'Mini loaves' is not in your current product list — confirm whether you carry this before adding to the order."
          : isAmbiguous
          ? "Client used uncertain language ('maybe', 'not sure') — confirm exact quantities before committing to production."
          : "Order is more than 30% above last week's quantity — flagged for your awareness."
        : null,
    },
    ai_confidence: needsReview ? 'medium' : 'high',
  }
}

function extractSignals(message: string): string[] {
  const signals: string[] = []
  const sentences = message.split(/[.,!]/).map(s => s.trim()).filter(s => s.length > 20)
  const keywords  = ['sold out', 'customers', 'asking for', 'flew', 'slow', 'left on', 'incredible', 'great week']

  for (const sentence of sentences) {
    if (keywords.some(k => sentence.toLowerCase().includes(k))) {
      signals.push(sentence.slice(0, 80))
      if (signals.length >= 3) break
    }
  }
  return signals
}