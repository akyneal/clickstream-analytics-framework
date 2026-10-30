/**
 * Reads schema/tracking-plan.json and writes
 * analytics/plan.generated.ts.
 *
 * Usage:  node scripts/generate-analytics-plan.mjs
 *
 * The output file is generated — never edit it by hand.
 * Workflow: edit the plan → export tracking-plan.json → run this → commit both.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCHEMA_PATH = resolve(ROOT, 'schema/tracking-plan.json');
const OUT_PATH = resolve(ROOT, 'analytics/plan.generated.ts');

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));

// ── Helpers ──────────────────────────────────────────────

/** Turn a comma-separated "allowed_values" string into discrete enum values. */
function parseEnumValues(allowed) {
  if (!allowed) return null;
  // Filter out descriptions — keep only short tokens that look like enum values
  const parts = allowed.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  const values = [];
  for (const p of parts) {
    // Skip descriptions like "true when accepted" or long phrases
    if (/\s/.test(p) && p.length > 30) continue;
    // Extract quoted or short snake_case / lowercase tokens
    const match = p.match(/^([a-z0-9_]+(?:\/[a-z0-9_]+)*)$/);
    if (match) values.push(match[1]);
  }
  return values.length > 0 ? values : null;
}

function tsType(paramDef) {
  switch (paramDef.type) {
    case 'boolean': return 'boolean';
    case 'integer': return 'number';
    case 'number': return 'number';
    case 'array': return 'unknown[]';
    default: return 'string';
  }
}

// ── Build output ─────────────────────────────────────────

const lines = [];
const ln = (s = '') => lines.push(s);

ln('// ────────────────────────────────────────────────────────');
ln('// AUTO-GENERATED from schema/tracking-plan.json');
ln('// Do not edit by hand. Run: npm run analytics:generate');
ln('// ────────────────────────────────────────────────────────');
ln();

// Schema version
ln(`export const SCHEMA_VERSION = ${JSON.stringify(schema.schema_version)} as const;`);
ln();

// Event names
const clientEvents = schema.events.filter(e => !e.server_only);
const serverEvents = schema.events.filter(e => e.server_only);
const allEventNames = schema.events.map(e => e.name);
const clientEventNames = clientEvents.map(e => e.name);

ln('/** All active event names (client + server). */');
ln(`export type EventName =`);
for (const name of allEventNames) {
  ln(`  | ${JSON.stringify(name)}`);
}
ln('  ;');
ln();

ln('/** Client-only event names (pushed via track()). */');
ln(`export type ClientEventName =`);
for (const name of clientEventNames) {
  ln(`  | ${JSON.stringify(name)}`);
}
ln('  ;');
ln();

// Deprecated
ln('/** Deprecated event names — rejected by guards. */');
ln(`export const DEPRECATED_EVENTS: readonly string[] = ${JSON.stringify(schema.deprecated_events)} as const;`);
ln();

// Server-only
ln('/** Server-only events — rejected by track(). */');
ln(`export const SERVER_ONLY_EVENTS: readonly string[] = ${JSON.stringify(serverEvents.map(e => e.name))} as const;`);
ln();

// Event metadata
ln('export interface EventMeta {');
ln('  readonly name: string;');
ln('  readonly phase: number;');
ln('  readonly tier: string;');
ln('  readonly parameters: readonly string[];');
ln('  readonly server_only?: true;');
ln('  readonly suppress_in_tutor_mode?: true;');
ln('}');
ln();

ln('/** Metadata for every active event, keyed by name. */');
ln('export const EVENT_META: Record<EventName, EventMeta> = {');
for (const ev of schema.events) {
  const meta = {
    name: ev.name,
    phase: ev.phase,
    tier: ev.tier,
    parameters: ev.parameters,
  };
  if (ev.server_only) meta.server_only = true;
  if (ev.suppress_in_tutor_mode) meta.suppress_in_tutor_mode = true;
  ln(`  ${JSON.stringify(ev.name)}: ${JSON.stringify(meta)},`);
}
ln('} as const;');
ln();

// Tutor-mode suppress list
const tutorSuppressed = schema.events
  .filter(e => e.suppress_in_tutor_mode)
  .map(e => e.name);
ln('/** Events suppressed when in tutor mode (student activity). */');
ln(`export const TUTOR_MODE_SUPPRESSED: ReadonlySet<string> = new Set(${JSON.stringify(tutorSuppressed)});`);
ln();

// Client event set for guards
ln('/** Set of all valid client event names for fast lookup. */');
ln(`export const CLIENT_EVENT_SET: ReadonlySet<string> = new Set(${JSON.stringify(clientEventNames)});`);
ln();

// Allowed parameters per event
ln('/** Allowed parameter names per event. */');
ln('export const EVENT_PARAMS: Record<EventName, ReadonlySet<string>> = {');
for (const ev of schema.events) {
  ln(`  ${JSON.stringify(ev.name)}: new Set(${JSON.stringify(ev.parameters)}),`);
}
ln('} as const;');
ln();

// Parameter types
ln('/** Parameter type definitions. */');
ln('export const PARAM_TYPES: Record<string, string> = {');
for (const [name, def] of Object.entries(schema.parameters)) {
  ln(`  ${JSON.stringify(name)}: ${JSON.stringify(def.type)},`);
}
ln('} as const;');
ln();

// EventParamsMap — typed params per client event
ln('/** Typed parameter map per client event. Used by track() for compile-time checking. */');
ln('export interface EventParamsMap {');
for (const ev of clientEvents) {
  if (ev.parameters.length === 0) {
    ln(`  ${JSON.stringify(ev.name)}: Record<string, never>;`);
    continue;
  }
  ln(`  ${JSON.stringify(ev.name)}: {`);
  for (const pname of ev.parameters) {
    const pdef = schema.parameters[pname];
    const t = pdef ? tsType(pdef) : 'string';
    // All event params are optional at the type level (guards handle required)
    ln(`    ${pname}?: ${t};`);
  }
  ln('  };');
}
ln('}');
ln();

// Content groups
const contentGroups = Object.keys(schema.route_mapping);
ln('/** Valid content group values. */');
ln(`export type ContentGroup =`);
for (const g of contentGroups) {
  ln(`  | ${JSON.stringify(g)}`);
}
ln('  ;');
ln();

// Route mapping
ln('/** Route template to content group mapping. */');
ln('export const ROUTE_TO_GROUP: ReadonlyMap<string, ContentGroup> = new Map([');
for (const [group, routes] of Object.entries(schema.route_mapping)) {
  for (const route of routes) {
    ln(`  [${JSON.stringify(route)}, ${JSON.stringify(group)}],`);
  }
}
ln(']);');
ln();

// Unmapped routes
ln('/** Unmapped routes — no events are sent. */');
ln(`export const UNMAPPED_ROUTES: ReadonlySet<string> = new Set(${JSON.stringify(schema.unmapped_routes)});`);
ln();

// GTM Custom Event regex for the 139 client events
const regexBody = clientEventNames.join('|');
const regex = `^(${regexBody})$`;
ln('/** GTM Custom Event trigger regex for all client events. */');
ln(`export const GTM_TRIGGER_REGEX = ${JSON.stringify(regex)};`);
ln();

// ── Write ────────────────────────────────────────────────
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, lines.join('\n') + '\n');

console.log(`Generated ${OUT_PATH}`);
console.log(`  ${clientEventNames.length} client events`);
console.log(`  ${serverEvents.length} server-only events`);
console.log(`  ${Object.keys(schema.parameters).length} parameters`);
console.log(`  ${contentGroups.length} content groups`);
console.log(`  GTM regex: ${regex.length} chars`);
