# CaseCraft — Smartphone Cases E-Commerce Store

Semester Project for the **E-Commerce Course (Academic Year 2026–2027)**.
- **Current Stage:** `P3` — Final Product & Live Delivery (Weeks 11–12)
- **Repository URL:** https://github.com/PabloRubioJurado/casecraft-ecommerce
- **Release Tag:** `P3`

## 1. Team Members & Roles
| Member | Role | Assigned Mandatory & Bonus Requirements |
| :--- | :--- | :--- |
| **Pablo Rubio Jurado** | Backend & Payments Lead | `A6`, `A7`, `A10`, `A12` (Webhook & payment tests), `B2`, `B5`, `B6` |
| **Darío López Campos** | Frontend & UX Lead | `A1`, `A2`, `A5`, `A11`, `B1`, `B7` |
| **Jaime Ballester Lara** | Full-Stack, Admin & QA Lead | `A3`, `A4`, `A8`, `A9`, `A12` (Cart & stock tests), `B3`, `B4` |

## 2. Store Niche & Context
**CaseCraft** is a custom-built online store specializing in protective and aesthetic smartphone cases. The database seed script populates **50 original products across 5 categories**:
1. Clear Minimalist
2. MagSafe Compatible
3. Eco-Friendly Biodegradable
4. Ultra-Impact Rugged
5. Leather Wallet Cases

## 3. Technology Stack
- **Frontend:** Next.js 16 (App Router, React 19) + Tailwind CSS
- **Backend:** Next.js Server Actions & Route Handlers (TypeScript) + Prisma ORM
- **Database:** PostgreSQL 16 (containerized with Docker Compose)
- **Payment Processor:** Stripe in Test Mode (verified via Stripe CLI Webhook `stripe listen`)
- **Transactional Email:** Nodemailer + Mailtrap SMTP Sandbox
- **Automated Testing:** Native Node.js Test Runner (`node --import tsx --test`)

## 4. How to Run Locally (5 Commands)

1. Copy the environment variables template and fill in your Stripe and Mailtrap sandbox keys:
   ```bash
   cp .env.example .env