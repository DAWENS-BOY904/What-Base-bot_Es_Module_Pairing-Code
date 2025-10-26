// ==================== server.js ====================
// --- Fix Node.js ESM __dirname ---
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core modules & packages ---
import express from "express";
import fs from "fs";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// --- Config ---
dotenv.config();
// ----------------- Paths -----------------
const PUBLIC_DIR = path.join(__dirname, "public");
const DB_PATH = path.join(__dirname, "database.db");

// Import des fonctions depuis index.js
import { activeSessions, loadConfig, startBotForSession } from './index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.head('/', (req, res) => res.status(200).send());
// ==================== KEEP ALIVE SYSTEM ====================
function startKeepAlive() {
  console.log('🫀 Initialisation du système Keep-Alive...');
  
  // Ping interne toutes les 4 minutes
  const keepAliveInterval = setInterval(async () => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`🫀 Keep-alive heartbeat - ${timestamp}`);
      
      // Vérifier le statut des sessions
      const connectedSessions = Array.from(activeSessions.values()).filter(s => s.connected).length;
      console.log(`📊 Sessions connectées: ${connectedSessions}/${activeSessions.size}`);
      
    } catch (error) {
      console.log('❌ Keep-alive error:', error.message);
    }
  }, 4 * 60 * 1000); // 4 minutes

  // Auto-ping externe si on est sur Render
  if (process.env.RENDER) {
    setInterval(async () => {
      try {
        const appUrl = `https://${process.env.RENDER_SERVICE_NAME}.onrender.com` || `http://localhost:${PORT}`;
        const response = await fetch(`${appUrl}/api/ping`);
        console.log(`🌐 External ping: ${response.status} - ${appUrl}`);
      } catch (error) {
        console.log('❌ External ping failed:', error.message);
      }
    }, 3 * 60 * 1000); // 3 minutes
  }

  return keepAliveInterval;
}

// ==================== Fonctions Helper ====================

function saveConfig(config) {
  try {
    const configPath = path.join(__dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde config:', error);
    return false;
  }
}

// ==================== API Routes ====================

// API pour récupérer la configuration ET le statut des sessions
app.get('/api/config', (req, res) => {
    try {
        const config = loadConfig();
        
        // Ajouter le statut des sessions actives
        const sessionsWithStatus = config.sessions.map(session => {
            const activeSession = activeSessions.get(session.name);
            return {
                ...session,
                status: activeSession ? (activeSession.connected ? 'connected' : 'connecting') : 'not_started',
                hasQr: activeSession && activeSession.qrCode ? true : false,
                lastActivity: activeSession?.performance?.lastActivity || null,
                connectionTime: activeSession?.performance?.connectionTime || null,
                welcomeMessageSent: activeSession?.performance?.welcomeMessageSent || false
            };
        });

        res.json({
            ...config,
            sessions: sessionsWithStatus,
            activeSessionsCount: activeSessions.size,
            totalSessions: config.sessions.length,
            serverUptime: process.uptime(),
            lastKeepAlive: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erreur lecture config:', error);
        res.status(500).json({ 
            error: 'Erreur de lecture de la configuration'
        });
    }
});

// API PING pour keep-alive
app.get('/api/ping', (req, res) => {
    res.json({ 
        status: 'alive', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        activeSessions: activeSessions.size,
        connectedSessions: Array.from(activeSessions.values()).filter(s => s.connected).length,
        memory: process.memoryUsage(),
        environment: process.env.RENDER ? 'render' : 'local'
    });
});

// API de santé améliorée
app.get('/api/health', (req, res) => {
    try {
        const config = loadConfig();
        const activeSessionsArray = Array.from(activeSessions.values());
        
        const stats = {
            connected: activeSessionsArray.filter(s => s.connected).length,
            connecting: activeSessionsArray.filter(s => !s.connected && !s.qrCode).length,
            qrRequired: activeSessionsArray.filter(s => s.qrCode).length,
            messageSent: activeSessionsArray.filter(s => s.performance?.welcomeMessageSent).length,
            totalMessages: activeSessionsArray.reduce((sum, s) => sum + (s.performance?.messageCount || 0), 0)
        };

        res.json({
            status: 'OK',
            message: 'MINI JESUS CRASH Server Running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            keepAlive: 'active',
            sessions: {
                active: activeSessions.size,
                total: config.sessions.length,
                stats: stats
            },
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            environment: process.env.RENDER ? 'render' : 'local'
        });
    } catch (error) {
        console.error('❌ Erreur health check:', error);
        res.status(500).json({ 
            status: 'ERROR',
            error: 'Erreur lors du health check'
        });
    }
});

// API pour sauvegarder la configuration ET démarrer les sessions
app.post('/api/config', async (req, res) => {
    try {
        const newConfig = req.body;

        // Validation basique
        if (!newConfig || typeof newConfig !== 'object') {
            return res.status(400).json({ error: 'Configuration invalide' });
        }

        // S'assurer que sessions est un tableau
        if (!Array.isArray(newConfig.sessions)) {
            newConfig.sessions = [];
        }

        // Charger l'ancienne config pour comparer
        const oldConfig = loadConfig();
        const oldSessions = oldConfig.sessions || [];

        // Trouver les nouvelles sessions
        const newSessions = newConfig.sessions.filter(newSession => 
            !oldSessions.some(oldSession => oldSession.name === newSession.name)
        );

        // Sauvegarder la configuration
        const success = saveConfig(newConfig);

        if (success) {
            console.log('✅ Configuration MINI JESUS CRASH sauvegardée');
            
            // DÉMARRER LES NOUVELLES SESSIONS
            let startedCount = 0;
            let failedCount = 0;
            
            if (newSessions.length > 0) {
                console.log(`🎯 Détection de ${newSessions.length} nouvelle(s) session(s) à démarrer:`);
                
                for (const session of newSessions) {
                    console.log(`   ➕ Démarrage de: ${session.name} (${session.ownerNumber})`);
                    try {
                        await startBotForSession(session);
                        startedCount++;
                        console.log(`   ✅ Session ${session.name} démarrée avec succès`);
                    } catch (error) {
                        console.error(`   ❌ Erreur démarrage session ${session.name}:`, error.message);
                        failedCount++;
                    }
                }
            }

            res.json({ 
                success: true, 
                message: 'Configuration sauvegardée avec succès!',
                sessionsCount: newConfig.sessions.length,
                newSessionsStarted: startedCount,
                newSessionsFailed: failedCount,
                activeSessions: Array.from(activeSessions.keys()),
                keepAlive: 'active'
            });
        } else {
            throw new Error('Échec de la sauvegarde');
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde config:', error);
        res.status(500).json({ 
            error: 'Erreur lors du déploiement: ' + error.message
        });
    }
});

// ==================== API POUR LA SURVEILLANCE ====================

// API pour vérifier le statut d'une session
app.get('/api/session/:sessionName/status', (req, res) => {
    try {
        const { sessionName } = req.params;
        const session = activeSessions.get(sessionName);

        if (!session) {
            return res.json({
                exists: false,
                status: 'not_started',
                connected: false,
                hasQr: false,
                message: 'Session non démarrée ou non trouvée'
            });
        }

        res.json({
            exists: true,
            status: session.connected ? 'connected' : 'connecting',
            connected: session.connected,
            hasQr: !!session.qrCode,
            performance: session.performance,
            config: session.config,
            lastDisconnectTime: session.lastDisconnectTime,
            message: session.connected ? 
                '✅ Bot connecté et opérationnel' : 
                session.qrCode ? 
                    '📷 QR Code requis - Vérifiez la console' : 
                    '🔄 Connexion en cours...'
        });
    } catch (error) {
        console.error('❌ Erreur statut session:', error);
        res.status(500).json({ 
            error: 'Erreur serveur lors de la vérification du statut'
        });
    }
});

// API pour vérifier si MegaJS a réussi à charger la session
app.get('/api/session/:sessionName/mega-status', (req, res) => {
    try {
        const { sessionName } = req.params;
        const config = loadConfig();
        const sessionConfig = config.sessions.find(s => s.name === sessionName);

        if (!sessionConfig) {
            return res.status(404).json({ 
                error: 'Session non trouvée dans la configuration',
                sessionName,
                existsInConfig: false
            });
        }

        const sessionUserDir = path.join(__dirname, 'sessions', sessionName);
        const credsPath = path.join(sessionUserDir, 'creds.json');
        
        const megaLoaded = fs.existsSync(credsPath);
        const sessionDirExists = fs.existsSync(sessionUserDir);
        
        res.json({
            sessionName,
            existsInConfig: true,
            megaLoaded,
            hasLocalSession: megaLoaded,
            sessionDirExists,
            sessionPath: sessionUserDir,
            message: megaLoaded ? 
                '✅ Session Mega chargée avec succès' : 
                '🔄 Session Mega non encore chargée'
        });
    } catch (error) {
        console.error('❌ Erreur vérification Mega:', error);
        res.status(500).json({ 
            error: 'Erreur serveur lors de la vérification Mega'
        });
    }
});

// API pour surveiller la connexion complète
app.get('/api/session/:sessionName/connection-status', async (req, res) => {
    try {
        const { sessionName } = req.params;
        const session = activeSessions.get(sessionName);

        if (!session) {
            return res.json({
                status: 'not_started',
                connected: false,
                messageSent: false,
                progress: 'session_not_started',
                details: 'La session n\'a pas été démarrée par le système'
            });
        }

        // Vérifier si le message de bienvenue a été envoyé
        const messageSent = session.performance?.welcomeMessageSent || false;
        
        let progress = 'connecting';
        let message = '🔄 Connexion en cours...';

        if (session.connected) {
            if (messageSent) {
                progress = 'completed';
                message = '✅ Bot connecté et message envoyé!';
            } else {
                progress = 'connected_no_message';
                message = '✅ Bot connecté - Envoi du message en cours...';
            }
        } else if (session.qrCode) {
            progress = 'qr_required';
            message = '📷 QR Code requis - Scannez le code dans la console';
        }

        res.json({
            status: session.connected ? 'connected' : 'connecting',
            connected: session.connected,
            hasQr: !!session.qrCode,
            messageSent: messageSent,
            progress: progress,
            message: message,
            performance: session.performance,
            lastActivity: session.performance?.lastActivity,
            connectionTime: session.performance?.connectionTime
        });

    } catch (error) {
        console.error('❌ Erreur statut connexion:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la vérification de la connexion'
        });
    }
});

// API pour voir les sessions actives avec détails
app.get('/api/sessions/active', (req, res) => {
    try {
        const sessions = Array.from(activeSessions.entries()).map(([name, session]) => ({
            name,
            connected: session.connected,
            hasQr: !!session.qrCode,
            ownerNumber: session.config?.ownerNumber,
            performance: session.performance,
            lastDisconnectTime: session.lastDisconnectTime,
            config: session.config,
            status: session.connected ? 'connected' : 
                   session.qrCode ? 'qr_required' : 'connecting',
            welcomeMessageSent: session.performance?.welcomeMessageSent || false
        }));

        res.json({
            total: activeSessions.size,
            sessions: sessions,
            stats: {
                connected: sessions.filter(s => s.connected).length,
                connecting: sessions.filter(s => !s.connected && !s.hasQr).length,
                qrRequired: sessions.filter(s => s.hasQr).length,
                messageSent: sessions.filter(s => s.welcomeMessageSent).length
            },
            serverUptime: process.uptime(),
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erreur récupération sessions:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour forcer le démarrage d'une session spécifique
app.post('/api/sessions/start', async (req, res) => {
    try {
        const { sessionName } = req.body;
        
        if (!sessionName) {
            return res.status(400).json({ error: 'Nom de session requis' });
        }

        const config = loadConfig();
        const session = config.sessions.find(s => s.name === sessionName);
        
        if (!session) {
            return res.status(404).json({ error: 'Session non trouvée dans la config' });
        }

        // Vérifier si la session est déjà active
        if (activeSessions.has(sessionName)) {
            const activeSession = activeSessions.get(sessionName);
            return res.json({ 
                success: true, 
                message: 'Session déjà active',
                sessionName: sessionName,
                connected: activeSession.connected,
                status: activeSession.connected ? 'connected' : 'connecting'
            });
        }

        // Démarrer la session
        await startBotForSession(session);
        
        res.json({ 
            success: true, 
            message: 'Session démarrée avec succès',
            sessionName: sessionName,
            status: 'starting'
        });

    } catch (error) {
        console.error('❌ Erreur démarrage session:', error);
        res.status(500).json({ 
            error: 'Erreur lors du démarrage: ' + error.message
        });
    }
});

// API pour obtenir les logs d'une session spécifique
app.get('/api/session/:sessionName/logs', (req, res) => {
    try {
        const { sessionName } = req.params;
        const session = activeSessions.get(sessionName);

        if (!session) {
            return res.status(404).json({ 
                error: 'Session non trouvée ou non active',
                sessionName
            });
        }

        res.json({
            sessionName,
            performance: session.performance,
            config: session.config,
            connectionInfo: {
                connected: session.connected,
                hasQr: !!session.qrCode,
                lastDisconnectTime: session.lastDisconnectTime,
                welcomeMessageSent: session.performance?.welcomeMessageSent || false,
                uptime: session.connected && session.performance.connectionTime ? 
                    Date.now() - session.performance.connectionTime : 0
            }
        });
    } catch (error) {
        console.error('❌ Erreur récupération logs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// API pour les statistiques globales
app.get('/api/stats', (req, res) => {
    try {
        const config = loadConfig();
        const activeSessionsArray = Array.from(activeSessions.values());
        
        const stats = {
            global: {
                totalSessions: config.sessions.length,
                activeSessions: activeSessions.size,
                uptime: process.uptime(),
                serverStartTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
                keepAlive: 'active'
            },
            sessions: {
                connected: activeSessionsArray.filter(s => s.connected).length,
                connecting: activeSessionsArray.filter(s => !s.connected && !s.qrCode).length,
                qrRequired: activeSessionsArray.filter(s => s.qrCode).length,
                messageSent: activeSessionsArray.filter(s => s.performance?.welcomeMessageSent).length,
                disconnected: config.sessions.length - activeSessions.size
            },
            performance: {
                totalMessages: activeSessionsArray.reduce((sum, s) => sum + (s.performance?.messageCount || 0), 0),
                averageUptime: activeSessionsArray.filter(s => s.connected && s.performance.connectionTime)
                    .reduce((avg, s, i, arr) => {
                        const uptime = Date.now() - s.performance.connectionTime;
                        return (avg * i + uptime) / (i + 1);
                    }, 0)
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('❌ Erreur statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route 404 améliorée
app.use((req, res) => {
    res.status(404).json({
        error: 'Page non trouvée',
        message: 'Utilisez / pour déployer une session MINI JESUS CRASH',
        availableEndpoints: [
            'GET  / - Page de déploiement',
            'GET  /api/config - Configuration',
            'GET  /api/ping - Keep-alive',
            'GET  /api/health - Santé du serveur',
            'POST /api/config - Sauvegarder configuration',
            'GET  /api/session/:name/status - Statut session',
            'GET  /api/session/:name/mega-status - Statut Mega',
            'GET  /api/session/:name/connection-status - Statut connexion complète',
            'GET  /api/sessions/active - Sessions actives',
            'GET  /api/stats - Statistiques'
        ]
    });
});

// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
    console.error('❌ Erreur non gérée:', error);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
});
    console.log(`=========================================`);
    console.log(`🚀 Déploiement: http://localhost:${PORT}`);
    console.log(`🔧 API Config: http://localhost:${PORT}/api/config`);
    console.log(`📊 Sessions: http://localhost:${PORT}/api/sessions/active`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log(`🫀 Keep-alive: http://localhost:${PORT}/api/ping`);
    console.log(`📈 Stats: http://localhost:${PORT}/api/stats`);
    console.log(`=========================================\n`);

// session config
app.use(session({
  secret: process.env.SESSION_SECRET || "change_this_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // maxAge set per login "Remember Me" logic below
    // default: session cookie (browser close)
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// open sqlite DB
let db;
(async () => {
  db = await open({
    filename: './data/dawens.sqlite',
    driver: sqlite3.Database
  });

  // create table if not exists
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    provider TEXT,
    provider_id TEXT,
    created_at INTEGER
  );`);
})().catch(err => { console.error(err); process.exit(1); });

// passport serialize/deserialize
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const row = await db.get("SELECT * FROM users WHERE id = ?", id);
    done(null, row || false);
  } catch (err) {
    done(err);
  }
});

// LOCAL STRATEGY
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase());
    if (!user) return done(null, false, { message: "Incorrect email or password." });
    if (!user.password) return done(null, false, { message: "No local password set for this account." });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return done(null, false, { message: "Incorrect email or password." });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// OAUTH: GOOGLE
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: (process.env.BASE_URL || `http://localhost:${PORT}`) + "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      let user = email ? await db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase()) : null;
      if (!user) {
        // create user
        const id = uuidv4();
        await db.run("INSERT INTO users (id, username, email, provider, provider_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          id, profile.displayName || (email || "user"), email ? email.toLowerCase() : null, "google", profile.id, Date.now());
        user = await db.get("SELECT * FROM users WHERE id = ?", id);
      } else {
        // link provider if not set
        if (!user.provider) {
          await db.run("UPDATE users SET provider = ?, provider_id = ? WHERE id = ?", "google", profile.id, user.id);
        }
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

// OAUTH: GITHUB
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: (process.env.BASE_URL || `http://localhost:${PORT}`) + "/auth/github/callback",
    scope: ["user:email"]
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // try to find primary email
      let email = null;
      if (profile.emails && profile.emails.length) email = profile.emails[0].value;
      let user = email ? await db.get("SELECT * FROM users WHERE email = ?", email.toLowerCase()) : null;
      if (!user) {
        const id = uuidv4();
        await db.run("INSERT INTO users (id, username, email, provider, provider_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          id, profile.username || profile.displayName || "github_user", email ? email.toLowerCase() : null, "github", profile.id, Date.now());
        user = await db.get("SELECT * FROM users WHERE id = ?", id);
      } else {
        if (!user.provider) {
          await db.run("UPDATE users SET provider = ?, provider_id = ? WHERE id = ?", "github", profile.id, user.id);
        }
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

// helper: ensure authenticated
function ensureAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.redirect("/login.html");
}

// ROUTES

// health
app.get("/health", (req, res) => res.json({ ok: true }));

// local signup API
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!email || !username) return res.status(400).json({ error: "Missing fields" });
    const e = email.toLowerCase();
    const existing = await db.get("SELECT * FROM users WHERE email = ?", e);
    if (existing) return res.status(400).json({ error: "Email already in use" });
    const id = uuidv4();
    const hash = password ? await bcrypt.hash(password, 10) : null;
    await db.run("INSERT INTO users (id, username, email, phone, password, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      id, username, e, phone || null, hash, Date.now());
    return res.json({ ok: true, message: "Account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// local login (POST)
app.post("/api/login", (req, res, next) => {
  const remember = req.body.remember === "true" || req.body.remember === true;
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Auth error" });
    if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
    req.logIn(user, (err2) => {
      if (err2) return res.status(500).json({ error: "Login error" });
      // set cookie maxAge based on remember flag. If remember -> 30 days. Else 10 hours
      const ms = remember ? 30 * 24 * 3600 * 1000 : 10 * 3600 * 1000;
      req.session.cookie.maxAge = ms;
      // return success
      res.json({ ok: true, message: "Logged in" });
    });
  })(req, res, next);
});

// logout
app.post("/api/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
});

// current user
app.get("/api/me", (req, res) => {
  if (!req.user) return res.json({ user: null });
  const user = { id: req.user.id, username: req.user.username, email: req.user.email, phone: req.user.phone };
  res.json({ user });
});

// OAuth routes
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] }));
  app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login.html" }), (req, res) => {
    // on success redirect to index
    res.redirect("/");
  });
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
  app.get("/auth/github/callback", passport.authenticate("github", { failureRedirect: "/login.html" }), (req, res) => {
    res.redirect("/");
  });
}

app.get("/signup", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "signup.html"));
});
// Page d'accueil = login
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "login.html"));
});

// static files (login/signup available publicly)
app.get("/login.html", (req, res) => res.sendFile(path.join(__dirname, "public/login.html")));
app.get("/signup.html", (req, res) => res.sendFile(path.join(__dirname, "public/signup.html")));
app.get("/index.html", ensureAuth, (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);

    setTimeout(() => startKeepAlive(), 5000);
});

export default app;
