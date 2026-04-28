# Backup Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete local backup import/export flow so accounting data can be restored by replacing or merging records, categories, and tags.

**Architecture:** Add a dedicated backup utility for file format, validation, and merge logic. Extend local data hooks with replace operations, then wire a data-management flow into the record list modal.

**Tech Stack:** React 19, Vite 8, plain CSS, browser File API, localStorage

---

## File Map

- Create: `src/utils/backup.js`
- Modify: `src/utils/export.js`
- Modify: `src/hooks/useRecords.js`
- Modify: `src/hooks/useCategories.js`
- Modify: `src/hooks/useTags.js`
- Modify: `src/App.jsx`
- Modify: `src/components/RecordList.jsx`
- Modify: `src/components/RecordList.css`

### Task 1: Build backup utility and export format
### Task 2: Add replace operations to local data hooks
### Task 3: Wire import/export actions into App and RecordList
### Task 4: Validate with lint and production build
