# Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first private-user Cloudflare Worker + D1 cloud sync flow for push, pull, and status.

**Architecture:** Keep the React app as the local-first client, add a Cloudflare Worker API backed by a single D1 snapshot row, and store sync settings locally in the browser.

**Tech Stack:** React 19, Vite 8, Cloudflare Workers, Cloudflare D1, plain CSS

---

## File Map

- Create: `cloudflare/worker/src/index.js`
- Create: `cloudflare/worker/schema.sql`
- Create: `cloudflare/worker/wrangler.jsonc.example`
- Create: `src/utils/sync.js`
- Modify: `src/App.jsx`
- Modify: `src/components/RecordList.jsx`
- Modify: `src/components/RecordList.css`
- Modify: `src/utils/storage.js`

### Task 1: Add Worker + D1 sync backend scaffold
### Task 2: Add frontend sync client and local sync-settings persistence
### Task 3: Extend data-management modal with manual cloud sync actions
### Task 4: Document deployment and manual verification steps
