# Statistics Curve Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the statistics page bar-style trend visuals with a refined SVG line-chart system that feels more premium and more legible on mobile.

**Architecture:** Keep the existing statistics data model and view model, but replace bar rendering with a reusable SVG curve renderer inside `Statistics.jsx`. Update the statistics stylesheet to support a darker, quieter financial-dashboard presentation.

**Tech Stack:** React 19, Vite 8, plain CSS, inline SVG

---

## File Map

- Modify: `src/utils/statistics.js`
- Modify: `src/components/Statistics.jsx`
- Modify: `src/components/Statistics.css`

### Task 1: Clean up statistics strings and preserve current trend data contract
### Task 2: Replace bar renderers with SVG curve charts for mini and detail views
### Task 3: Refine statistics page styling toward premium financial-dashboard look
### Task 4: Validate with lint and production build
