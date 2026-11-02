# Employee Onboarding & Offboarding

A small full-stack app for HR teams to manage the employee lifecycle:
**onboarding → active → offboarding → exited**.

- **Frontend:** React 18 + Vite + React Router (`client/`)
- **Backend:** Node.js + Express REST API (`server/`)
- **Storage:** JSON file (`server/data/db.json`), no database setup needed

## Features

- Onboard a new hire: an onboarding checklist (HR, IT, Manager and Employee tasks) is
  generated with due dates based on the start date.
- Start offboarding with a last working day and reason: an exit checklist is generated
  (handover, exit interview, equipment return, access revocation, final settlement…).
- Tick tasks off; the status moves forward automatically when a checklist is complete.
- Dashboard with headcount by status, open tasks and overdue tasks.
- Search and filter employees by status.

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. The React dev server forwards `/api` calls to Express on port 4000.

### Production

```bash
npm run build
```

```bash
npm start
```

Express serves the built React app and the API at http://localhost:4000.

### Tests

```bash
npm test
```

## Project structure

```
client/                React frontend
  src/pages/           Dashboard, EmployeeList, NewEmployee, EmployeeDetail
  src/components/      Shared UI (status badge, progress bar)
  src/api.js           API client
server/                Node.js backend
  src/app.js           Express routes
  src/services.js      Lifecycle business rules
  src/checklists.js    Default onboarding/offboarding tasks (edit to customise)
  src/store.js         JSON file storage
  test/                API tests (node:test + supertest)
```

## REST API

| Method | Path                         | Description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| GET    | `/api/stats`                 | Counts by status, open and overdue tasks   |
| GET    | `/api/employees`             | List (`?status=`, `?search=`)              |
| POST   | `/api/employees`             | Onboard a new employee                     |
| GET    | `/api/employees/:id`         | Employee with tasks                        |
| DELETE | `/api/employees/:id`         | Delete an employee and their tasks         |
| POST   | `/api/employees/:id/offboard`| Start offboarding (`endDate`, `exitReason`)|
| PATCH  | `/api/tasks/:id`             | Mark a task done/undone (`{ "done": true }`)|

## Configuration

| Variable    | Default                 |
| ----------- | ----------------------- |
| `PORT`      | `4000`                  |
| `DATA_FILE` | `server/data/db.json`   |
