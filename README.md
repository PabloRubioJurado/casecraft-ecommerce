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

## 4. Requirements Status & Roadmap 

### Mandatory Requirements (`A1`–`A12`)
| Code | Requirement | Owner | Target Week | Status |
| :--- | :--- | :--- | :--- | :--- |
| `A1` | Product catalog (max 24/page, categories, details) | Darío Lopez Campos | Week 6 (P2) | Planned |
| `A2` | Basic search by product name | Darío Lopez Campos | Week 8 | Planned |
| `A3` | Persistent shopping cart & server-side recalculation | Jaime Ballester Lara | Week 8 | Planned |
| `A4` | User accounts (Argon2/bcrypt + delivery address) | Jaime Ballester Lara | Week 6 (P2) | Planned |
| `A5` | Multi-step checkout (2+ delivery methods) | Darío Lopez Campos | Week 9 | Planned |
| `A6` | Sandbox payment via Stripe Webhook | Pablo Rubio Jurado | Week 9 | Planned |
| `A7` | Stock management & concurrency control | Pablo Rubio Jurado | Week 9 | Planned |
| `A8` | Customer order history | Jaime Ballester Lara | Week 10 | Planned |
| `A9` | Custom administration panel (CRUD + order statuses) | Jaime Ballester Lara | Week 10 | Planned |
| `A10` | Basic security (validation, CSRF, ORM, server RBAC) | Pablo Rubio Jurado | Week 8 | Planned |
| `A11` | Responsive design (360 px screen support) | Darío Lopez Campos | Week 11 | Planned |
| `A12` | Automated tests (10+ tests via single command) | Pablo R. & Jaime B. | Week 11 | Planned |

### Optional Bonus Features (`B1`–`B7`)
*Note: We are implementing all bonus features to deliver a complete e-commerce experience, acknowledging that the final bonus score is capped at 20 points per the project specification.*

| Code | Bonus Feature | Points | Owner | Target Week | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `B1` | Filtered search (category, price, stock, URL state) | 5 pts | Darío Lopez Campos | Week 11 | Planned |
| `B2` | Recommendations (Computed "Similar products") | 4 pts | Pablo Rubio Jurado | Week 11 | Planned |
| `B3` | Reviews and ratings (verified buyers + admin toggle) | 4 pts | Jaime Ballester Lara | Week 11 | Planned |
| `B4` | Sales dashboard (daily sales chart, top 5, AOV) | 3 pts | Jaime Ballester Lara | Week 11 | Planned |
| `B5` | Discount codes (server-validated expiry & max uses) | 3 pts | Pablo Rubio Jurado | Week 11 | Planned |
| `B6` | Transactional email (order confirmation via Mailtrap) | 5 pts | Pablo Rubio Jurado | Week 11 | Planned |
| `B7` | Wishlist (favorites list linked to cart) | 2 pts | Darío Lopez Campos | Week 11 | Planned |

## 5. How to Run Locally (Max 5 Commands)
1. Copy the environment variables template:
   ```bash
   cp .env.example .env
2. Start PostgreSQL in Docker:
   ```bash
   docker compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create the tables and load the seed data:
   ```bash
   npm run db:push && npm run db:seed
   ```
5. Start the development server (http://localhost:3000):
   ```bash
   npm run dev
   ```
