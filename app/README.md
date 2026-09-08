# Hospital Management Suite 2.0.0

Next.js desk app (manager, secretary, doctor, patient).

## Run

Requirements: **Node.js 22+**.

```bash
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
|---|---|
| `npm run check` | Lint + Vitest |
| `npm run ci:local` | Lint + Vitest + production build |
| `npm run test:e2e` | Playwright smoke |
| `npm run db:reset` | Wipe and reseed SQLite |

SQLite file: `../data/hospital.db`. Demo passwords are bcrypt-hashed at seed time.
