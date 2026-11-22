import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const extension = path.resolve(here, '../extension');
const room = process.env.LORKAN_ROOM_ID;
const count = Number(process.env.LORKAN_AI_COUNT ?? 25);
const maxMinutes = Number(process.env.LORKAN_MAX_MINUTES ?? 90);
if (!/^[A-Za-z0-9_-]{6,32}$/.test(room ?? '')) throw Error('Set LORKAN_ROOM_ID to a private room code');
if (!Number.isInteger(count) || count < 1 || count > 25) throw Error('LORKAN_AI_COUNT must be 1 through 25');
if (!Number.isFinite(maxMinutes) || maxMinutes < 1 || maxMinutes > 300) throw Error('Invalid run duration');

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const statuses = new Map();
const pages = new Map();
const failures = [];
const pageWarnings = [];
const startedAt = Date.now();
let stopping = false;
let browser;

async function roomInfo() {
  const routeReply = await fetch(`https://api.frontwars.io/api/game/${encodeURIComponent(room)}/route`);
  if (!routeReply.ok) throw Error(`Room route HTTP ${routeReply.status}`);
  const route = await routeReply.json();
  const base = new URL(route.httpBase);
  if (base.protocol !== 'https:' || !(base.hostname === 'frontwars.io' || base.hostname.endsWith('.frontwars.io')) || !/^w\d+$/.test(route.workerPath)) throw Error('Unexpected room route');
  const reply = await fetch(`${base.origin}/${route.workerPath}/api/game/${encodeURIComponent(room)}`);
  if (!reply.ok) throw Error(`Room state HTTP ${reply.status}`);
  const info = await reply.json();
  if (info.gameID !== room || info.gameConfig?.gameType !== 'Private') throw Error('Only a verified private room is supported');
  return info;
}

function summary() {
  const all = [...statuses.values()];
  return {
    event: 'progress',
    time: new Date().toISOString(),
    expected: count,
    pages: pages.size,
    admitted: all.filter(s => s.seatAdmitted).length,
    enabled: all.filter(s => s.enabled).length,
    spawned: all.filter(s => s.spawned).length,
    totalSubmittedCommands: all.reduce((sum, s) => sum + (s.submittedCommands ?? 0), 0),
    minGameTick: all.some(s => s.matchStarted) ? Math.min(...all.filter(s => s.matchStarted).map(s => s.tick ?? 0)) : 0,
    failures: failures.length,
  };
}

async function command(page, action, extra = {}) {
  await page.evaluate(({ room, action, extra }) => {
    window.postMessage({ source: 'lorkan-private05-control', room, action, ...extra }, location.origin);
  }, { room, action, extra });
}

async function addRole(role) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 900, height: 600 } });
  await context.addInitScript({ path: path.join(extension, 'guest-bootstrap.js') });
  const page = await context.newPage();
  const seat = { role, context, page, relay: null };
  pages.set(role, seat);
  page.on('pageerror', error => {
    const item = { role, at: new Date().toISOString(), error: error.message.slice(0, 240) };
    if (item.error.includes('browsingTopics() is deprecated')) pageWarnings.push(item);
    else failures.push(item);
  });
  page.on('close', () => { if (!stopping) failures.push({ role, at: new Date().toISOString(), error: 'Guest page closed' }); });
  await page.exposeBinding('__lorkanCloudRelay', (_, message) => {
    if (!message || message.room !== room || !Number.isInteger(message.role) || message.role < 0 || message.role > 25) return;
    for (const other of pages.values()) if (other.role !== role && other.relay && !other.page.isClosed()) other.page.evaluate(value => window.__lorkanRelay?.postMessage(value), message).catch(() => {});
  });
  await page.goto(`https://frontwars.io/?game=${encodeURIComponent(room)}&lorkanRole=${role}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(room => {
    window.__lorkanCloudStatuses = [];
    window.addEventListener('message', event => {
      if (event.origin === location.origin && event.source === window && event.data?.source === 'lorkan-private05-status') {
        window.__lorkanCloudStatuses.push(event.data);
        if (window.__lorkanCloudStatuses.length > 5) window.__lorkanCloudStatuses.shift();
      }
    });
    window.__lorkanRelay = new BroadcastChannel('lorkan-private05-' + room);
    window.__lorkanRelay.onmessage = event => window.__lorkanCloudRelay(event.data);
  }, room);
  seat.relay = true;
  await page.addScriptTag({ path: path.join(extension, 'native-bridge.js') });
  return seat;
}

async function refresh() {
  await Promise.all([...pages.values()].map(async seat => {
    try {
      await command(seat.page, 'pulse');
      const current = await seat.page.evaluate(() => window.__lorkanCloudStatuses?.at(-1));
      if (current) statuses.set(seat.role, current);
    } catch (error) { failures.push({ role: seat.role, at: new Date().toISOString(), error: error.message.slice(0, 240) }); }
  }));
}

async function stop() {
  if (stopping) return;
  stopping = true;
  await Promise.all([...pages.values()].map(async seat => { try { await command(seat.page, 'stop'); } catch {} }));
  await browser?.close().catch(() => {});
}

process.on('SIGINT', () => { stop().finally(() => { process.exitCode = 130; }); });
process.on('SIGTERM', () => { stop().finally(() => { process.exitCode = 143; }); });

try {
  const info = await roomInfo();
  if (!Array.isArray(info.clients) || info.clients.length < 1 || !info.creatorClientID || !info.clients.some(c => c.clientID === info.creatorClientID)) throw Error('Room host is absent');
  if (info.clients.length + count > (info.gameConfig.maxPlayers ?? 200)) throw Error('Room does not have enough free seats');
  console.log(JSON.stringify({ event: 'room_checked', type: 'Private', existingPlayers: info.clients.length, requestedAI: count }));
  browser = await chromium.launch({ headless: true, channel: process.env.LORKAN_BROWSER_CHANNEL ?? 'chromium' });
  for (let first = 1; first <= count; first += 3) {
    await Promise.all(Array.from({ length: Math.min(3, count - first + 1) }, (_, i) => addRole(first + i)));
    await refresh();
    console.log(JSON.stringify(summary()));
  }
  for (let attempt = 0; attempt < 30; attempt++) {
    await refresh();
    const admitted = [...statuses.values()].filter(s => s.seatAdmitted && s.guest?.ok && s.gameType === 'Private');
    const ids = admitted.map(s => s.clientID);
    if (admitted.length === count && new Set(ids).size === count && !ids.includes(info.creatorClientID)) break;
    if (attempt === 29) throw Error(`Only ${admitted.length}/${count} independent guest seats were admitted`);
    await pause(2000);
  }
  const managedClientIDs = [...statuses.values()].map(s => s.clientID);
  await Promise.all([...pages.values()].map(async seat => {
    await command(seat.page, 'protection', { protection: { protectSquad: true, protectOwner: false, ownerClientID: info.creatorClientID, managedClientIDs } });
    await command(seat.page, 'start', { confirmedControl: true });
  }));
  for (let attempt = 0; attempt < 20; attempt++) {
    await pause(1000);
    await refresh();
    if ([...statuses.values()].filter(s => s.enabled).length === count) break;
    if (attempt === 19) throw Error('Some admitted guests did not confirm AI control');
  }
  console.log(JSON.stringify({ event: 'all_ai_armed', ...summary() }));
  let lastLog = 0;
  while (!stopping && Date.now() - startedAt < maxMinutes * 60000) {
    await pause(5000);
    await refresh();
    const all = [...statuses.values()];
    if (all.some(s => !s.enabled && !s.matchStarted)) throw Error('A guest stopped before match start');
    if (Date.now() - lastLog > 30000) { console.log(JSON.stringify(summary())); lastLog = Date.now(); }
    if (all.some(s => s.matchStarted) && all.every(s => !s.enabled)) break;
  }
  const result = { ...summary(), event: 'finished', perRole: [...statuses.entries()].map(([role, s]) => ({ role, clientID: s.clientID, admitted: s.seatAdmitted, enabled: s.enabled, spawned: s.spawned, submittedCommands: s.submittedCommands, tick: s.tick, reason: s.reason, serverAcceptanceVerified: s.serverAcceptanceVerified })), failures, pageWarnings };
  fs.writeFileSync(process.env.LORKAN_RESULT_PATH ?? 'cloud-private-room-result.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(summary()));
} catch (error) {
  console.error(JSON.stringify({ event: 'failure', message: error.message, ...summary() }));
  process.exitCode = 1;
} finally { await stop(); }

