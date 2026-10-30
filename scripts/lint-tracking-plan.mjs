/**
 * Lints schema/tracking-plan.json against the Taxonomy rules.
 * Task TX-W3 from the tracking plan.
 *
 * Usage:  node scripts/lint-tracking-plan.mjs
 * Exit 0 if clean, 1 if violations found.
 *
 * Rules checked:
 *  1. snake_case names (letters, digits, underscores only)
 *  2. Event name ≤ 40 chars, parameter name ≤ 40 chars
 *  3. Every event has a tier (page, interaction, outcome, system)
 *  4. ≤ 25 parameters per event (including 8 shared context)
 *  5. Custom events use object_action (verb from the approved list, or
 *     documented suffix _click / _error), unless they are GA4
 *     standard/recommended names
 *  6. No personal-data parameter names
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, '..', 'schema/tracking-plan.json');
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));

const SHARED_CONTEXT_COUNT = schema.shared_context.length; // 8
const VALID_TIERS = new Set(['page', 'interaction', 'outcome', 'system']);
const MAX_EVENT_NAME = 40;
const MAX_PARAM_NAME = 40;
const MAX_PARAMS_PER_EVENT = 25; // including shared context

// GA4 standard/recommended names exempt from object_action rule
const GA4_NAMES = new Set([
  'page_view', 'sign_up', 'login', 'logout', 'search', 'share',
  'select_content', 'view_search_results', 'generate_lead', 'exception',
  'view_item_list', 'select_item', 'view_item', 'add_to_cart',
  'remove_from_cart', 'view_cart', 'begin_checkout', 'purchase', 'refund',
  'course_enroll', 'select_promotion', 'view_promotion',
  'video_start', 'video_progress', 'video_complete',
]);

// Approved verbs from the Taxonomy tab
const APPROVED_VERBS = new Set([
  'open', 'click', 'send', 'start', 'view', 'complete', 'create', 'delete',
  'select', 'change', 'error', 'update', 'answer', 'apply', 'dismiss',
  'generate', 'request', 'share', 'submit', 'use', 'accept', 'add',
  'assign', 'block', 'cancel', 'copy', 'decline', 'edit', 'end', 'enroll',
  'favorite', 'follow', 'hit', 'join', 'milestone', 'pause', 'post',
  'publish', 'react', 'remove', 'resend', 'respond', 'restart', 'resume',
  'return', 'review', 'set', 'step', 'toggle', 'unsubscribe', 'upvote',
  'verify', 'vitals', 'vote',
]);

const PII_PARAM_NAMES = new Set([
  'email', 'name', 'first_name', 'last_name', 'phone', 'dob',
  'message', 'text', 'body', 'address', 'ssn',
]);

const violations = [];
const warn = (msg) => violations.push(msg);

// ── Check events ─────────────────────────────────────────

for (const ev of schema.events) {
  const { name } = ev;

  // Rule 1: snake_case
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    warn(`Event "${name}": not snake_case (letters, digits, underscores only)`);
  }

  // Rule 2: length
  if (name.length > MAX_EVENT_NAME) {
    warn(`Event "${name}": ${name.length} chars, max ${MAX_EVENT_NAME}`);
  }

  // Rule 3: tier
  if (!VALID_TIERS.has(ev.tier)) {
    warn(`Event "${name}": missing or invalid tier "${ev.tier}" (must be page/interaction/outcome/system)`);
  }

  // Rule 4: param count
  const totalParams = ev.parameters.length + SHARED_CONTEXT_COUNT;
  if (totalParams > MAX_PARAMS_PER_EVENT) {
    warn(`Event "${name}": ${totalParams} params (${ev.parameters.length} + ${SHARED_CONTEXT_COUNT} shared), max ${MAX_PARAMS_PER_EVENT}`);
  }

  // Rule 5: naming convention (object_action with approved verb)
  if (!GA4_NAMES.has(name)) {
    // Custom event: must be object_action or documented suffix
    const parts = name.split('_');
    const lastWord = parts[parts.length - 1];

    if (!APPROVED_VERBS.has(lastWord)) {
      // Check documented suffixes: _click, _error
      if (!name.endsWith('_click') && !name.endsWith('_error')) {
        warn(`Event "${name}": last word "${lastWord}" is not an approved verb or documented suffix (_click, _error)`);
      }
    }
  }
}

// ── Check deprecated events ──────────────────────────────

for (const name of schema.deprecated_events) {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    warn(`Deprecated event "${name}": not snake_case`);
  }
}

// ── Check parameters ─────────────────────────────────────

for (const [pname, pdef] of Object.entries(schema.parameters)) {
  // Rule 1: snake_case
  if (!/^[a-z][a-z0-9_]*$/.test(pname)) {
    warn(`Parameter "${pname}": not snake_case`);
  }

  // Rule 2: length
  if (pname.length > MAX_PARAM_NAME) {
    warn(`Parameter "${pname}": ${pname.length} chars, max ${MAX_PARAM_NAME}`);
  }

  // Rule 6: PII names
  if (PII_PARAM_NAMES.has(pname)) {
    warn(`Parameter "${pname}": matches a personal-data name`);
  }
}

// ── Check that every event's parameters exist in the parameter registry ──

const allParams = new Set(Object.keys(schema.parameters));
// Some event params come from ecommerce (items, value, currency, coupon) — these are
// at the ecommerce object level, not event_params, so they're not in Parameter Reference
// as standalone params. Allow them.
const ECOMMERCE_PARAMS = new Set(['items', 'value', 'currency', 'coupon', 'transaction_id']);

for (const ev of schema.events) {
  for (const p of ev.parameters) {
    if (!allParams.has(p) && !ECOMMERCE_PARAMS.has(p)) {
      warn(`Event "${ev.name}": parameter "${p}" not found in Parameter Reference`);
    }
  }
}

// ── Report ───────────────────────────────────────────────

console.log(`Lint: ${schema.events.length} events, ${Object.keys(schema.parameters).length} parameters`);

if (violations.length === 0) {
  console.log('✓ No violations found.');
  process.exit(0);
} else {
  console.log(`✗ ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.log(`  • ${v}`);
  }
  process.exit(1);
}
