# CaseCraft — Smartphone Cases E-Commerce Store

Semester Project for the **E-Commerce Course (Academic Year 2026–2027)**.
* **Current Stage:** `P1` — Team Setup and Planning (Week 3)
* **Repository URL:** https://github.com/PabloRubioJurado/casecraft-ecommerce
* **Release Tag:** `P1`

## 1. Team Members & Roles
| Member | Role | Assigned Mandatory Requirements |
| :--- | :--- | :--- |
| **Pablo Rubio Jurado** | Backend & Payments Lead | `A6`, `A7`, `A10`, `A12` (Backend tests) |
| **Dario Lopez Campos** | Frontend & UX Lead | `A1`, `A2`, `A5`, `A11` |
| **Jaime Ballester Lara** | Full-Stack, Admin & QA Lead | `A3`, `A4`, `A8`, `A9`, `A12` (Cart tests) |

## 2. Store Niche & Context
**CaseCraft** is a specialized online store selling protective and aesthetic smartphone cases. The database seed script populates **35+ original products across 5 categories**:
1. MagSafe Compatible Cases
2. Ultra-Impact Rugged Cases
3. Eco-Friendly Biodegradable Cases
4. Clear Minimalist Cases
5. Leather Wallet Cases

## 3. Technology Stack
* **Frontend:** Next.js (React) + Tailwind CSS
* **Backend:** Next.js API Layer (Node.js / TypeScript) + Prisma ORM
* **Database:** PostgreSQL 16 (containerized with Docker)
* **Payment Processor:** Stripe in Test Mode (verified via Stripe CLI Webhook `stripe listen`)
* **Testing:** Jest & Supertest / Playwright

## 4. Requirements Status & Roadmap (`A1`–`A12` & Bonuses)
| Code | Requirement | Owner | Target Week | Status |
| :--- | :--- | :--- | :--- | :--- |
| `A1` | Product catalog (max 24/page, categories, details) | [Nombre Compañero 2] | Week 6 (P2) | Planned |
| `A2` | Basic search by product name | [Nombre Compañero 2] | Week 8 | Planned |
| `A3` | Persistent shopping cart & server-side recalculation | [Nombre Compañero 3] | Week 8 | Planned |
| `A4` | User accounts (Argon2/bcrypt + delivery address) | [Nombre Compañero 3] | Week 6 (P2) | Planned |
| `A5` | Multi-step checkout (2+ delivery methods) | [Nombre Compañero 2] | Week 9 | Planned |
| `A6` | Sandbox payment via Stripe Webhook | Pablo Rubio Jurado | Week 9 | Planned |
| `A7` | Stock management & concurrency control | Pablo Rubio Jurado | Week 9 | Planned |
| `A8` | Customer order history | [Nombre Compañero 3] | Week 10 | Planned |
| `A9` | Custom administration panel (CRUD + order statuses) | [Nombre Compañero 3] | Week 10 | Planned |
| `A10` | Basic security (validation, CSRF, ORM, server RBAC) | Pablo Rubio Jurado | Week 8 | Planned |
| `A11` | Responsive design (360 px screen support) | [Nombre Compañero 2] | Week 11 | Planned |
| `A12` | Automated tests (10+ tests via single command) | Pablo Rubio Jurado & [Nombre Compañero 3] | Week 11 | Planned |

**Planned Bonus Features (for P2 approval):** `B1` Filtered search (5 pts), `B5` Discount codes (3 pts), `B6` Transactional email via Mailtrap (5 pts).

## 5. How to Run Locally (Max 5 Commands)
1. Copy the environment variables template:
   ```bash
   cp .env.example .env
