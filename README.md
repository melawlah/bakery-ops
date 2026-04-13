# BakeryOps

AI-native operations management for wholesale bakeries. Built for a real bakery.

**[→ Live demo](https://bakeryops.vercel.app)**

---

## The problem

Wholesale bakeries receive orders as freeform WhatsApp messages, emails, and texts. An owner manually reads each one, figures out what was actually ordered, checks inventory, calculates production, and tries to spot whether the business is growing. All of this happens in their head, every week, on top of running an actual bakery.

BakeryOps rebuilds this process as an AI-native workflow.

---

## What it does

**Order Intake** — Retail partners reply in natural language. The AI interprets their message into a structured order, extracts feedback signals, and flags anything ambiguous for human review before it touches production.

**Orders Dashboard** — All orders for the week in one view. Confirmed automatically where AI confidence is high. Pending human approval where it isn't. Live production summary showing total mixes per product.

**Weekly Report** — Numbers first, then AI narrative. Revenue trends, client performance, slow-moving products, and specific flags: which clients show churn signals, which products are compressing margins, what the next growth lever is.

---

## The AI boundary

The AI interprets, analyses, and recommends. One decision always stays human: **confirming the production run.** A wrong production number has real physical consequences — wasted ingredients, staff overtime, an unfulfilled client order. The system is designed so AI errors surface as flagged questions, never as committed actions.

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Postgres via Supabase |
| AI | Claude API (`claude-sonnet-4-20250514`) |
| Email | Resend |
| Invoicing | QuickBooks API (planned) |
| Hosting | Vercel |

---

## Running locally

```bash
git clone https://github.com/yourusername/bakery-ops.git
cd bakery-ops
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Required environment variables are documented in `.env.example`.

---

## What's next

The prototype runs on mock data. The architecture is production-ready. Next steps: live Supabase connection, Supabase Auth with staff roles, WhatsApp/SMS order intake via webhooks, QuickBooks invoice generation, and ingredient reorder automation.

---

*Built with Next.js · Supabase · Claude API · Resend*
