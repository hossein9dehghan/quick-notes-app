# Quick Notes App — backend

The server side of **Quick Notes App**, made by Duxner Maker: an HTTP API (Hono) over a Postgres database.
Your app talks to it through `platform.db`, the same way it uses data on the device.

## Run it with Docker (easiest)

1. Copy `.env.example` to `.env`. Fill in `JWT_SECRET` (run `openssl rand -base64 48`) and `POSTGRES_PASSWORD`.
   Put your app's web address in `ALLOWED_ORIGINS`.
2. `docker compose up -d`
3. Open `http://<your server>:8787/health` — it shows `{"ok":true,...}` and the database version (migration).

## Run it without Docker

Needs Node 22.18 or newer and a Postgres database.
`npm install`, set `DATABASE_URL` and `JWT_SECRET` in `.env`, then `npm run dev`.

## What is where

- `db/schema.json` — the data model this was made from. `db/migrations/` — the database changes, applied in order at start
  (or with `npm run migrate`). Never edit an applied migration; Maker adds a new one when the model changes.
  A migration that can delete data is only written after you confirm it.
- `db/schema.ts` — the same tables for Drizzle ORM. `src/custom.ts` — your own endpoints (Maker never overwrites it).
- Everything else in `src/` is regenerated from the model.

## The API

- `GET /health` — `{ ok, version, migration }`
- `/v1/auth/` — `signup`, `login`, `refresh`, `logout`, `me`, `magic-link`, `magic-link/verify`
- `/v1/<collection>` — `GET` (list; filters like `?where.done.eq=false&orderBy=createdAt.desc&limit=20`), `POST`;
  `/v1/<collection>/<id>` — `GET`, `PUT`, `PATCH`, `DELETE`; `/v1/<collection>/count`; `/v1/<collection>/events` (live changes)

Send `Authorization: Bearer <accessToken>`. Collections marked "per person" only ever show each person their own records.
Errors look like `{ "error": { "code": "invalid", "message": "..." } }`.

## Settings

All settings come from the environment — see `.env.example`. No secret is stored in the code.
Passwords are hashed with PBKDF2-SHA256 (600 000 rounds), which needs no extra software and runs everywhere.
