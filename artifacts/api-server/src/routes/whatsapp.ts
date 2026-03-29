import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");

const QRCode = require("qrcode");
const pino = require("pino");

const router: IRouter = Router();

const SESSIONS_DIR = path.join(process.cwd(), "pair_sessions");
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

interface SessionEntry {
  sock: ReturnType<typeof makeWASocket>;
  sessionDir: string;
  connected: boolean;
  sessionID: string | null;
  qrDataUrl?: string | null;
  qrExpired?: boolean;
}

const activeSessions = new Map<string, SessionEntry>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanDir(dir: string) {
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
}

function encodeSession(dir: string): string | null {
  try {
    return (
      "DJ~" +
      Buffer.from(
        fs.readFileSync(path.join(dir, "creds.json"), "utf-8")
      ).toString("base64")
    );
  } catch {
    return null;
  }
}

async function getVersion(): Promise<[number, number, number]> {
  try {
    return (await fetchLatestBaileysVersion()).version;
  } catch {
    return [2, 3000, 1015901307];
  }
}

// POST /api/pair — Pair Code Method
router.post("/pair", async (req, res) => {
  let { number } = req.body as { number?: string };
  if (!number) {
    return res.status(400).json({ error: "Phone number required" });
  }
  number = number.replace(/[^0-9]/g, "");
  if (number.length < 10) {
    return res
      .status(400)
      .json({ error: "Invalid number — use international format (e.g. 923001234567)" });
  }

  const token = "pair_" + Date.now();
  const sessionDir = path.join(SESSIONS_DIR, token);
  cleanDir(sessionDir);
  fs.mkdirSync(sessionDir, { recursive: true });

  const logger = pino({ level: "silent" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const version = await getVersion();

    const sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ["Mac OS", "Chrome", "14.4.1"],
      printQRInTerminal: false,
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 10_000,
      connectTimeoutMs: 60_000,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });

    const entry: SessionEntry = { sock, sessionDir, connected: false, sessionID: null };
    activeSessions.set(token, entry);
    sock.ev.on("creds.update", saveCreds);

    let pairCodeRequested = false;
    let pairCodeValue: string | null = null;
    let pairCodeError: string | null = null;

    sock.ev.on("connection.update", async (update: Record<string, unknown>) => {
      const { connection, lastDisconnect, qr } = update as {
        connection?: string;
        lastDisconnect?: { error?: { output?: { statusCode?: number } } };
        qr?: string;
      };
      const e = activeSessions.get(token);
      if (!e) return;

      if (
        !pairCodeRequested &&
        !sock.authState.creds.registered &&
        !!qr
      ) {
        pairCodeRequested = true;
        try {
          await sleep(3000);
          let code: string = await sock.requestPairingCode(number);
          code = code?.replace(/(.{4})/g, "$1-").slice(0, -1) || code;
          pairCodeValue = code;
        } catch (err: unknown) {
          pairCodeError = (err as Error).message;
        }
      }

      if (connection === "open") {
        await sleep(2000);
        const encoded = encodeSession(sessionDir);
        if (encoded) {
          e.connected = true;
          e.sessionID = encoded;
        }
        try { sock.end(); } catch {}
      }

      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.loggedOut || code === 401) {
          activeSessions.delete(token);
          cleanDir(sessionDir);
        }
      }
    });

    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      await sleep(500);
      if (pairCodeValue) break;
      if (pairCodeError) break;
    }

    if (!pairCodeValue) {
      try { sock.end(); } catch {}
      activeSessions.delete(token);
      cleanDir(sessionDir);
      return res
        .status(500)
        .json({ error: pairCodeError || "Pair code nahi aaya. Dobara try karein." });
    }

    setTimeout(() => {
      const e = activeSessions.get(token);
      if (e && !e.connected) {
        try { e.sock.end(); } catch {}
        activeSessions.delete(token);
        cleanDir(sessionDir);
      }
    }, 5 * 60 * 1000);

    return res.json({ pairCode: pairCodeValue, sessionId: token });
  } catch (err: unknown) {
    activeSessions.delete(token);
    cleanDir(sessionDir);
    return res.status(500).json({ error: "Server error: " + (err as Error).message });
  }
});

// POST /api/qr — QR Code Method
router.post("/qr", async (_req, res) => {
  const token = "qr_" + Date.now();
  const sessionDir = path.join(SESSIONS_DIR, token);
  cleanDir(sessionDir);
  fs.mkdirSync(sessionDir, { recursive: true });

  const logger = pino({ level: "silent" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const version = await getVersion();

    const sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ["Mac OS", "Chrome", "14.4.1"],
      printQRInTerminal: false,
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 10_000,
      connectTimeoutMs: 60_000,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    const entry: SessionEntry = {
      sock,
      sessionDir,
      connected: false,
      sessionID: null,
      qrDataUrl: null,
      qrExpired: false,
    };
    activeSessions.set(token, entry);
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: Record<string, unknown>) => {
      const { connection, lastDisconnect, qr } = update as {
        connection?: string;
        lastDisconnect?: { error?: { output?: { statusCode?: number } } };
        qr?: string;
      };
      const e = activeSessions.get(token);
      if (!e) return;

      if (qr) {
        try {
          e.qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          e.qrExpired = false;
        } catch {}
      }

      if (connection === "open") {
        await sleep(2000);
        const encoded = encodeSession(sessionDir);
        if (encoded) {
          e.connected = true;
          e.sessionID = encoded;
        }
        try { sock.end(); } catch {}
      }

      if (connection === "close") {
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.timedOut) {
          const e2 = activeSessions.get(token);
          if (e2) e2.qrExpired = true;
        }
        if (code === DisconnectReason.loggedOut || code === 401) {
          activeSessions.delete(token);
          cleanDir(sessionDir);
        }
        if (code === DisconnectReason.restartRequired) {
          activeSessions.delete(token);
          cleanDir(sessionDir);
        }
      }
    });

    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const e = activeSessions.get(token);
      if (e?.qrDataUrl) {
        return res.json({ sessionId: token, qr: e.qrDataUrl });
      }
    }

    try { sock.end(); } catch {}
    activeSessions.delete(token);
    cleanDir(sessionDir);
    return res.status(500).json({ error: "QR generate nahi hua. Dobara try karein." });
  } catch (err: unknown) {
    activeSessions.delete(token);
    cleanDir(sessionDir);
    return res.status(500).json({ error: "Server error: " + (err as Error).message });
  }
});

// GET /api/qr/:token — Poll QR status
router.get("/qr/:token", (req, res) => {
  const e = activeSessions.get(req.params.token);
  if (!e) return res.json({ status: "expired" });
  if (e.connected && e.sessionID) {
    const sid = e.sessionID;
    activeSessions.delete(req.params.token);
    cleanDir(e.sessionDir);
    return res.json({ status: "connected", sessionID: sid });
  }
  if (e.qrExpired) return res.json({ status: "expired" });
  return res.json({ status: "waiting", qr: e.qrDataUrl });
});

// GET /api/status/:token — Poll pair code status
router.get("/status/:token", (req, res) => {
  const e = activeSessions.get(req.params.token);
  if (!e) return res.json({ status: "expired" });
  if (e.connected && e.sessionID) {
    const sid = e.sessionID;
    activeSessions.delete(req.params.token);
    cleanDir(e.sessionDir);
    return res.json({ status: "connected", sessionID: sid });
  }
  return res.json({ status: "waiting" });
});

export default router;
