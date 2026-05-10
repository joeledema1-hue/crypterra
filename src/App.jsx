import { useState, useEffect, useRef } from “react”;
import { initializeApp } from “firebase/app”;
import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut,
onAuthStateChanged,
} from “firebase/auth”;
import {
getFirestore,
doc,
setDoc,
getDoc,
updateDoc,
collection,
onSnapshot,
addDoc,
query,
orderBy,
serverTimestamp,
getDocs,
} from “firebase/firestore”;

// ── PASTE YOUR FIREBASE CONFIG HERE ──────────────────────────────────────────
const firebaseConfig = {
apiKey: “AIzaSyBjMu-HPR-B3bszsNcHj4dplHglL-q4q9U”,
authDomain: “crypterra-44fc2.firebaseapp.com”,
projectId: “crypterra-44fc2”,
storageBucket: “crypterra-44fc2.firebasestorage.app”,
messagingSenderId: “536850455527”,
appId: “1:536850455527:web:3b9a5a744f1a5156af3b42”,
};
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = “joeledema33@gmail.com”;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── STYLES ───────────────────────────────────────────────────────────────────
const G = {
bg: “#0a0c10”,
surface: “#111318”,
card: “#161b24”,
border: “#1e2535”,
accent: “#00e5a0”,
accentDim: “#00e5a022”,
accentGlow: “#00e5a044”,
gold: “#f0c040”,
red: “#ff4d6a”,
text: “#e8eaf0”,
muted: “#5a6380”,
font: “‘DM Mono’, monospace”,
display: “‘Syne’, sans-serif”,
};

const css = `
@import url(‘https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap’);
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${G.bg}; color: ${G.text}; font-family: ${G.font}; min-height: 100vh; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: ${G.bg}; }
::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes glow { 0%,100%{box-shadow:0 0 8px ${G.accentGlow}} 50%{box-shadow:0 0 24px ${G.accentGlow},0 0 48px ${G.accentDim}} }
@keyframes countUp { from{transform:scale(.95);opacity:.6} to{transform:scale(1);opacity:1} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

.fade-in { animation: fadeIn .4s ease forwards; }
.glow-btn { animation: glow 2.5s ease-in-out infinite; }
.pulse { animation: pulse 1.5s ease-in-out infinite; }
.spin { animation: spin 1s linear infinite; }

input, textarea {
background: ${G.surface}; border: 1px solid ${G.border}; color: ${G.text};
font-family: ${G.font}; font-size: 14px; border-radius: 8px;
padding: 12px 16px; width: 100%; outline: none; transition: border-color .2s;
}
input:focus, textarea:focus { border-color: ${G.accent}; }
input::placeholder, textarea::placeholder { color: ${G.muted}; }

button { cursor: pointer; font-family: ${G.display}; font-weight: 600; border: none; outline: none; transition: all .2s; }

.ticker-wrap { overflow: hidden; background: ${G.surface}; border-top: 1px solid ${G.border}; border-bottom: 1px solid ${G.border}; padding: 8px 0; }
.ticker-content { display: flex; white-space: nowrap; animation: ticker 30s linear infinite; }
.ticker-item { padding: 0 40px; font-size: 12px; color: ${G.muted}; }
.ticker-item span { color: ${G.accent}; margin-left: 6px; }

.chat-bubble-user { background: ${G.accentDim}; border: 1px solid ${G.accent}33; border-radius: 16px 16px 4px 16px; padding: 10px 14px; max-width: 75%; align-self: flex-end; font-size: 13px; }
.chat-bubble-admin { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 16px 16px 16px 4px; padding: 10px 14px; max-width: 75%; align-self: flex-start; font-size: 13px; }
`;

// ── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(n) {
return Number(n || 0).toLocaleString(“en-US”, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Spinner() {
return <div style={{ width: 20, height: 20, border: `2px solid ${G.border}`, borderTopColor: G.accent, borderRadius: “50%” }} className=“spin” />;
}

function Btn({ children, onClick, variant = “primary”, disabled, style = {}, size = “md” }) {
const base = {
borderRadius: 10, fontWeight: 700, letterSpacing: “.04em”,
padding: size === “sm” ? “8px 16px” : size === “lg” ? “16px 32px” : “12px 24px”,
fontSize: size === “sm” ? 12 : size === “lg” ? 16 : 14,
display: “inline-flex”, alignItems: “center”, gap: 8,
opacity: disabled ? .4 : 1, pointerEvents: disabled ? “none” : “auto”,
};
const variants = {
primary: { background: G.accent, color: “#000” },
ghost: { background: “transparent”, border: `1px solid ${G.border}`, color: G.text },
danger: { background: G.red, color: “#fff” },
gold: { background: G.gold, color: “#000” },
};
return (
<button style={{ …base, …variants[variant], …style }} onClick={onClick} disabled={disabled}>
{children}
</button>
);
}

function Card({ children, style = {} }) {
return (
<div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 24, …style }}>
{children}
</div>
);
}

// ── TICKER ───────────────────────────────────────────────────────────────────
const tickerData = [
[“BTC/USD”, “+2.41%”], [“ETH/USD”, “+1.87%”], [“XAU/USD”, “+0.32%”],
[“EUR/USD”, “-0.12%”], [“S&P500”, “+0.98%”], [“AAPL”, “+1.54%”],
[“TSLA”, “+3.22%”], [“OIL/USD”, “-0.45%”], [“GBP/USD”, “+0.18%”],
];

function Ticker() {
const items = […tickerData, …tickerData];
return (
<div className="ticker-wrap">
<div className="ticker-content">
{items.map(([sym, val], i) => (
<span key={i} className="ticker-item">
{sym}<span style={{ color: val.startsWith(”+”) ? G.accent : G.red }}>{val}</span>
</span>
))}
</div>
</div>
);
}

// ── AUTH SCREENS ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
const [mode, setMode] = useState(“login”);
const [form, setForm] = useState({ fullName: “”, username: “”, email: “”, password: “” });
const [err, setErr] = useState(””);
const [loading, setLoading] = useState(false);

const handle = (k) => (e) => setForm((f) => ({ …f, [k]: e.target.value }));

async function submit() {
setErr(””); setLoading(true);
try {
if (mode === “signup”) {
const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
await setDoc(doc(db, “users”, user.uid), {
fullName: form.fullName,
username: form.username,
email: form.email,
balance: 0,
profitIncrement: 0,
tradeStartTime: null,
tradeDurationMins: 0,
tradeActive: false,
createdAt: serverTimestamp(),
});
onLogin(user.uid);
} else {
const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);
// check if admin
if (form.email === ADMIN_EMAIL) { onLogin(user.uid, true); return; }
onLogin(user.uid);
}
} catch (e) {
setErr(e.message.replace(“Firebase: “, “”).replace(/(.*)/, “”).trim());
}
setLoading(false);
}

return (
<div style={{ minHeight: “100vh”, display: “flex”, flexDirection: “column”, background: G.bg }}>
<style>{css}</style>
<Ticker />
<div style={{ flex: 1, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 24 }}>
<div className=“fade-in” style={{ width: “100%”, maxWidth: 420 }}>
{/* Logo */}
<div style={{ textAlign: “center”, marginBottom: 40 }}>
<div style={{ display: “inline-flex”, alignItems: “center”, gap: 10, marginBottom: 8 }}>
<div style={{ width: 36, height: 36, background: G.accent, borderRadius: 10, display: “flex”, alignItems: “center”, justifyContent: “center” }}>
<span style={{ fontSize: 18, color: “#000”, fontFamily: G.display, fontWeight: 800 }}>T</span>
</div>
<span style={{ fontFamily: G.display, fontSize: 22, fontWeight: 800, letterSpacing: “-.02em” }}>Crypterra</span>
</div>
<p style={{ color: G.muted, fontSize: 13 }}>Intelligent Portfolio Management</p>
</div>

```
      <Card>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: G.surface, borderRadius: 10, padding: 4 }}>
          {["login", "signup"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "10px", borderRadius: 8, fontFamily: G.display,
              fontWeight: 700, fontSize: 13, letterSpacing: ".04em",
              background: mode === m ? G.accent : "transparent",
              color: mode === m ? "#000" : G.muted, border: "none",
            }}>
              {m === "login" ? "SIGN IN" : "REGISTER"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <>
              <input placeholder="Full Name" value={form.fullName} onChange={handle("fullName")} />
              <input placeholder="Username" value={form.username} onChange={handle("username")} />
            </>
          )}
          <input placeholder="Email Address" type="email" value={form.email} onChange={handle("email")} />
          <input placeholder="Password" type="password" value={form.password} onChange={handle("password")} />
          {err && <p style={{ color: G.red, fontSize: 12 }}>{err}</p>}
          <Btn onClick={submit} disabled={loading} size="lg" style={{ width: "100%", justifyContent: "center" }}>
            {loading ? <Spinner /> : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
          </Btn>
        </div>
      </Card>
      <p style={{ textAlign: "center", color: G.muted, fontSize: 12, marginTop: 20 }}>
        Secured by 256-bit encryption · Crypterra © 2025
      </p>
    </div>
  </div>
</div>
```

);
}

// ── LIVE CHAT ────────────────────────────────────────────────────────────────
function playNotificationSound() {
try {
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const o = ctx.createOscillator();
const g = ctx.createGain();
o.connect(g); g.connect(ctx.destination);
o.frequency.setValueAtTime(880, ctx.currentTime);
o.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
g.gain.setValueAtTime(0.3, ctx.currentTime);
g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
o.start(ctx.currentTime);
o.stop(ctx.currentTime + 0.4);
} catch (e) {}
}

function LiveChat({ userId, isAdmin, targetUserId }) {
const chatId = isAdmin ? `${targetUserId}_admin` : `${userId}_admin`;
const [msgs, setMsgs] = useState([]);
const [text, setText] = useState(””);
const [open, setOpen] = useState(false);
const [unread, setUnread] = useState(0);
const endRef = useRef(null);
const prevMsgCount = useRef(0);
const senderKey = isAdmin ? “admin” : “user”;
const otherSender = isAdmin ? “user” : “admin”;

// Always listen for new messages for notification badge
useEffect(() => {
const q = query(collection(db, “chats”, chatId, “messages”), orderBy(“ts”));
const unsub = onSnapshot(q, (snap) => {
const all = snap.docs.map((d) => ({ id: d.id, …d.data() }));
setMsgs(all);
// Count new messages from the other side
if (all.length > prevMsgCount.current) {
const newMsgs = all.slice(prevMsgCount.current);
const hasNewFromOther = newMsgs.some((m) => m.sender === otherSender);
if (hasNewFromOther && !open) {
setUnread((u) => u + newMsgs.filter((m) => m.sender === otherSender).length);
playNotificationSound();
}
}
prevMsgCount.current = all.length;
if (open) setTimeout(() => endRef.current?.scrollIntoView({ behavior: “smooth” }), 100);
});
return unsub;
}, [chatId, open, otherSender]);

function openChat() {
setOpen(true);
setUnread(0);
setTimeout(() => endRef.current?.scrollIntoView({ behavior: “smooth” }), 200);
}

async function send() {
if (!text.trim()) return;
await addDoc(collection(db, “chats”, chatId, “messages”), {
text: text.trim(),
sender: senderKey,
ts: serverTimestamp(),
});
setText(””);
}

if (!open) return (
<button onClick={openChat} className=“glow-btn” style={{
position: “fixed”, bottom: 24, right: 24, width: 56, height: 56,
borderRadius: “50%”, background: G.accent, color: “#000”, fontSize: 22,
display: “flex”, alignItems: “center”, justifyContent: “center”, zIndex: 100,
}}>
💬
{unread > 0 && (
<div style={{
position: “absolute”, top: -4, right: -4, width: 20, height: 20,
borderRadius: “50%”, background: G.red, color: “#fff”,
fontSize: 11, fontWeight: 800, display: “flex”, alignItems: “center”, justifyContent: “center”,
fontFamily: G.display, border: `2px solid ${G.bg}`,
}}>{unread}</div>
)}
</button>
);

return (
<div className=“fade-in” style={{
position: “fixed”, bottom: 0, right: 0, left: 0,
width: “100%”, maxWidth: 420, margin: “0 auto”,
height: “85vh”, maxHeight: 520,
background: G.card, border: `1px solid ${G.border}`,
borderRadius: “20px 20px 0 0”,
display: “flex”, flexDirection: “column”, zIndex: 100,
boxShadow: `0 -8px 40px #00000080`,
}}>
{/* Header */}
<div style={{ padding: “14px 18px”, borderBottom: `1px solid ${G.border}`, display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 10 }}>
<div style={{ width: 8, height: 8, borderRadius: “50%”, background: G.accent }} className=“pulse” />
<span style={{ fontFamily: G.display, fontWeight: 700, fontSize: 14 }}>
{isAdmin ? “User Chat” : “Support Chat”}
</span>
</div>
<button onClick={() => setOpen(false)} style={{ background: “none”, border: “none”, color: G.muted, fontSize: 22 }}>×</button>
</div>

```
  {/* Messages */}
  <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
    {msgs.length === 0 && (
      <p style={{ color: G.muted, fontSize: 12, textAlign: "center", marginTop: 40 }}>
        {isAdmin ? "No messages yet." : "Hi! Ask us anything about your trade."}
      </p>
    )}
    {msgs.map((m) => (
      <div key={m.id} className={m.sender === "user" ? "chat-bubble-user" : "chat-bubble-admin"}>
        <p style={{ fontSize: 13 }}>{m.text}</p>
      </div>
    ))}
    <div ref={endRef} />
  </div>

  {/* Input */}
  <div style={{ padding: 12, borderTop: `1px solid ${G.border}`, display: "flex", gap: 8 }}>
    <input
      placeholder="Type a message…"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && send()}
      style={{ flex: 1, padding: "10px 14px", fontSize: 13 }}
    />
    <Btn onClick={send} size="sm">Send</Btn>
  </div>
</div>
```

);
}

// ── USER DASHBOARD ───────────────────────────────────────────────────────────
function UserDashboard({ userId }) {
const [userData, setUserData] = useState(null);
const [timeLeft, setTimeLeft] = useState(null);
const [displayBalance, setDisplayBalance] = useState(0);

useEffect(() => {
const unsub = onSnapshot(doc(db, “users”, userId), (snap) => {
if (snap.exists()) setUserData({ id: snap.id, …snap.data() });
});
return unsub;
}, [userId]);

// Profit auto-increment every 10 minutes
useEffect(() => {
if (!userData?.tradeActive || !userData?.profitIncrement) return;
const interval = setInterval(async () => {
const ref = doc(db, “users”, userId);
const snap = await getDoc(ref);
if (!snap.exists()) return;
const d = snap.data();
if (!d.tradeActive) { clearInterval(interval); return; }
await updateDoc(ref, { balance: (d.balance || 0) + (d.profitIncrement || 0) });
}, 10 * 60 * 1000); // every 10 minutes
return () => clearInterval(interval);
}, [userData?.tradeActive, userData?.profitIncrement, userId]);

// Smooth balance counter
useEffect(() => {
if (!userData) return;
const target = userData.balance || 0;
const diff = target - displayBalance;
if (Math.abs(diff) < 0.01) { setDisplayBalance(target); return; }
const step = diff / 20;
const t = setTimeout(() => setDisplayBalance((p) => p + step), 30);
return () => clearTimeout(t);
}, [userData?.balance, displayBalance]);

// Countdown timer
useEffect(() => {
if (!userData?.tradeActive || !userData?.tradeStartTime || !userData?.tradeDurationMins) return;
const tick = () => {
const start = userData.tradeStartTime?.toDate?.() || new Date(userData.tradeStartTime);
const end = new Date(start.getTime() + userData.tradeDurationMins * 60 * 1000);
const left = end - Date.now();
if (left <= 0) {
setTimeLeft(0);
updateDoc(doc(db, “users”, userId), { tradeActive: false });
} else {
setTimeLeft(left);
}
};
tick();
const i = setInterval(tick, 1000);
return () => clearInterval(i);
}, [userData?.tradeActive, userData?.tradeStartTime, userData?.tradeDurationMins]);

function fmtTime(ms) {
if (ms <= 0) return “00:00:00”;
const h = Math.floor(ms / 3600000);
const m = Math.floor((ms % 3600000) / 60000);
const s = Math.floor((ms % 60000) / 1000);
return [h, m, s].map((v) => String(v).padStart(2, “0”)).join(”:”);
}

if (!userData) return (
<div style={{ minHeight: “100vh”, display: “flex”, alignItems: “center”, justifyContent: “center” }}>
<Spinner />
</div>
);

const tradeExpired = !userData.tradeActive && userData.tradeDurationMins > 0;
const profitPct = userData.initialBalance > 0
? (((userData.balance - userData.initialBalance) / userData.initialBalance) * 100).toFixed(2)
: “0.00”;

return (
<div style={{ minHeight: “100vh”, background: G.bg, paddingBottom: 80 }}>
<style>{css}</style>
<Ticker />

```
  {/* Header */}
  <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${G.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, background: G.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#000", fontFamily: G.display, fontWeight: 800 }}>C</span>
      </div>
      <span style={{ fontFamily: G.display, fontSize: 16, fontWeight: 800 }}>Crypterra</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, color: G.muted }}>{userData.username || userData.fullName}</span>
      <Btn variant="ghost" size="sm" onClick={() => signOut(auth)}>Sign Out</Btn>
    </div>
  </div>

  <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
    <div className="fade-in">

      {/* Balance Hero */}
      <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${G.card} 0%, #0d1520 100%)`, border: `1px solid ${G.accent}33`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: G.accentDim, filter: "blur(40px)" }} />
        <p style={{ color: G.muted, fontSize: 11, letterSpacing: ".1em", marginBottom: 6 }}>PORTFOLIO BALANCE</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontFamily: G.display, fontSize: 40, fontWeight: 800, color: G.accent, lineHeight: 1 }}>
            ${fmt(displayBalance)}
          </span>
          <span style={{ color: parseFloat(profitPct) >= 0 ? G.accent : G.red, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            {parseFloat(profitPct) >= 0 ? "+" : ""}{profitPct}%
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: G.muted, fontSize: 10 }}>INITIAL DEPOSIT</p>
            <p style={{ fontSize: 14, fontWeight: 600 }}>${fmt(userData.initialBalance || userData.balance)}</p>
          </div>
          <div>
            <p style={{ color: G.muted, fontSize: 10 }}>TOTAL PROFIT</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: G.accent }}>
              +${fmt(Math.max(0, (userData.balance || 0) - (userData.initialBalance || 0)))}
            </p>
          </div>
        </div>
      </Card>

      {/* Trade Status + Timer */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <p style={{ color: G.muted, fontSize: 10, letterSpacing: ".1em", marginBottom: 6 }}>TRADE STATUS</p>
            {userData.tradeActive ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.accent }} className="pulse" />
                <span style={{ color: G.accent, fontWeight: 700, fontSize: 15, fontFamily: G.display }}>ACTIVE</span>
              </div>
            ) : tradeExpired ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.gold }} />
                <span style={{ color: G.gold, fontWeight: 700, fontSize: 15, fontFamily: G.display }}>COMPLETED</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.muted }} />
                <span style={{ color: G.muted, fontWeight: 700, fontSize: 15, fontFamily: G.display }}>PENDING</span>
              </div>
            )}
          </div>

          {userData.tradeActive && timeLeft > 0 ? (
            <div style={{ textAlign: "right" }}>
              <p style={{ color: G.muted, fontSize: 10, letterSpacing: ".1em", marginBottom: 4 }}>TIME LEFT</p>
              <p style={{ fontFamily: G.display, fontSize: 24, fontWeight: 800, color: G.text }}>{fmtTime(timeLeft)}</p>
            </div>
          ) : null}
        </div>

        {tradeExpired || timeLeft === 0 ? (
          <Btn variant="gold" size="lg" onClick={() => alert("Withdrawal request submitted! Our team will process it shortly.")} style={{ width: "100%", justifyContent: "center" }}>
            💰 WITHDRAW FUNDS
          </Btn>
        ) : !userData.tradeActive ? (
          <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: "8px 0" }}>
            Awaiting trade activation by your portfolio manager
          </p>
        ) : null}
      </Card>

      {/* Activity */}
      <Card>
        <p style={{ color: G.muted, fontSize: 11, letterSpacing: ".1em", marginBottom: 14 }}>RECENT ACTIVITY</p>
        {userData.tradeActive ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: G.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📈</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Active Trade Running</p>
                  <p style={{ fontSize: 11, color: G.muted }}>Portfolio manager is trading on your behalf</p>
                </div>
              </div>
              <span style={{ color: G.accent, fontSize: 12, fontWeight: 700 }}>LIVE</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${G.gold}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💹</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Profit Accumulating</p>
                  <p style={{ fontSize: 11, color: G.muted }}>Growing automatically over time</p>
                </div>
              </div>
              <span style={{ color: G.gold, fontSize: 12, fontWeight: 700 }}>ACTIVE</span>
            </div>
          </div>
        ) : (
          <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
            No active trades. Contact support for more information.
          </p>
        )}
      </Card>
    </div>
  </div>

  <LiveChat userId={userId} isAdmin={false} />
</div>
```

);
}

// ── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ adminId }) {
const [users, setUsers] = useState([]);
const [selected, setSelected] = useState(null);
const [form, setForm] = useState({ balance: “”, profitIncrement: “”, tradeDurationMins: “”, initialBalance: “” });
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
const [tab, setTab] = useState(“controls”);

useEffect(() => {
const unsub = onSnapshot(collection(db, “users”), (snap) => {
setUsers(snap.docs.map((d) => ({ id: d.id, …d.data() })));
});
return unsub;
}, []);

function selectUser(u) {
setSelected(u);
setForm({
balance: u.balance || “”,
profitIncrement: u.profitIncrement || “”,
tradeDurationMins: u.tradeDurationMins || “”,
initialBalance: u.initialBalance || u.balance || “”,
});
}

async function save() {
if (!selected) return;
setSaving(true);
await updateDoc(doc(db, “users”, selected.id), {
balance: parseFloat(form.balance) || 0,
profitIncrement: parseFloat(form.profitIncrement) || 0,
tradeDurationMins: parseFloat(form.tradeDurationMins) || 0,
initialBalance: parseFloat(form.initialBalance) || parseFloat(form.balance) || 0,
});
setSaving(false);
setSaved(true);
setTimeout(() => setSaved(false), 2000);
}

async function toggleTrade() {
if (!selected) return;
const newActive = !selected.tradeActive;
await updateDoc(doc(db, “users”, selected.id), {
tradeActive: newActive,
tradeStartTime: newActive ? new Date() : null,
});
setSelected((p) => ({ …p, tradeActive: newActive }));
}

// If a user is selected, show full-screen user detail
if (selected) {
return (
<div style={{ minHeight: “100vh”, background: G.bg, paddingBottom: 40 }}>
<style>{css}</style>
<Ticker />
{/* Header with back button */}
<div style={{ padding: “14px 16px”, display: “flex”, justifyContent: “space-between”, alignItems: “center”, borderBottom: `1px solid ${G.border}` }}>
<button onClick={() => setSelected(null)} style={{
background: G.surface, border: `1px solid ${G.border}`, color: G.text,
borderRadius: 8, padding: “8px 14px”, fontSize: 13, display: “flex”, alignItems: “center”, gap: 6,
}}>← Back</button>
<span style={{ fontFamily: G.display, fontSize: 14, fontWeight: 800, color: G.red }}>ADMIN</span>
<Btn variant=“ghost” size=“sm” onClick={() => signOut(auth)}>Sign Out</Btn>
</div>

```
    <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
      {/* User info */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: G.display, fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{selected.fullName}</h2>
        <p style={{ color: G.muted, fontSize: 12, marginBottom: 16 }}>@{selected.username} · {selected.email}</p>
        <Btn
          variant={selected.tradeActive ? "danger" : "primary"}
          onClick={toggleTrade}
          style={{ width: "100%", justifyContent: "center" }}
          size="lg"
        >
          {selected.tradeActive ? "⏹  Stop Trade" : "▶  Start Trade"}
        </Btn>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: G.surface, borderRadius: 10, padding: 4 }}>
        {["controls", "chat"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "12px", borderRadius: 8, fontFamily: G.display, fontWeight: 700, fontSize: 13,
            background: tab === t ? G.accent : "transparent", color: tab === t ? "#000" : G.muted,
            border: "none", letterSpacing: ".06em", textTransform: "uppercase",
          }}>{t}</button>
        ))}
      </div>

      {tab === "controls" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["Initial Deposit ($)", "initialBalance", "The starting balance shown to user"],
            ["Current Balance ($)", "balance", "Live portfolio value"],
            ["Profit Increment ($)", "profitIncrement", "Amount added every 10 minutes"],
            ["Trade Duration (mins)", "tradeDurationMins", "How long until trade expires"],
          ].map(([label, key, hint]) => (
            <div key={key} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 12, color: G.muted, letterSpacing: ".06em", marginBottom: 8 }}>{label}</p>
              <input
                type="number"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                style={{ marginBottom: 4, fontSize: 16 }}
              />
              <p style={{ fontSize: 11, color: G.muted }}>{hint}</p>
            </div>
          ))}
          <Btn onClick={save} disabled={saving} size="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {saving ? <Spinner /> : saved ? "✅ Saved!" : "💾 Save Changes"}
          </Btn>
        </div>
      ) : (
        <div style={{ height: "60vh", background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <AdminChatPanel userId={selected.id} />
        </div>
      )}
    </div>
  </div>
);
```

}

// Default: user list screen
return (
<div style={{ minHeight: “100vh”, background: G.bg }}>
<style>{css}</style>
<Ticker />

```
  {/* Header */}
  <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${G.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, background: G.red, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#fff", fontFamily: G.display, fontWeight: 800 }}>A</span>
      </div>
      <span style={{ fontFamily: G.display, fontSize: 16, fontWeight: 800 }}>Crypterra <span style={{ color: G.red, fontSize: 11 }}>ADMIN</span></span>
    </div>
    <Btn variant="ghost" size="sm" onClick={() => signOut(auth)}>Sign Out</Btn>
  </div>

  {/* Stats */}
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: G.border }}>
    {[
      ["USERS", users.length, "👥"],
      ["ACTIVE", users.filter((u) => u.tradeActive).length, "📈"],
      ["AUM", "$" + fmt(users.reduce((s, u) => s + (u.balance || 0), 0)), "💰"],
    ].map(([label, val, icon]) => (
      <div key={label} style={{ background: G.surface, padding: "14px 8px", textAlign: "center" }}>
        <p style={{ color: G.muted, fontSize: 10, letterSpacing: ".1em" }}>{label}</p>
        <p style={{ fontFamily: G.display, fontSize: 18, fontWeight: 800, marginTop: 4 }}>{icon} {val}</p>
      </div>
    ))}
  </div>

  {/* User List */}
  <div style={{ padding: "16px" }}>
    <p style={{ fontFamily: G.display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", color: G.muted, marginBottom: 12 }}>ALL USERS</p>
    {users.length === 0 && (
      <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>No users yet</p>
    )}
    {users.map((u) => (
      <div key={u.id} onClick={() => { selectUser(u); setTab("controls"); }} style={{
        background: G.card, border: `1px solid ${G.border}`, borderRadius: 12,
        padding: "16px", marginBottom: 12, cursor: "pointer",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{u.fullName}</p>
            <p style={{ fontSize: 12, color: G.muted }}>@{u.username} · {u.email}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 15, color: G.accent, fontWeight: 700 }}>${fmt(u.balance)}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: u.tradeActive ? G.accent : G.muted }} className={u.tradeActive ? "pulse" : ""} />
              <span style={{ fontSize: 11, color: G.muted }}>{u.tradeActive ? "live" : "idle"}</span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

);
}

function AdminChatPanel({ userId }) {
const chatId = `${userId}_admin`;
const [msgs, setMsgs] = useState([]);
const [text, setText] = useState(””);
const endRef = useRef(null);
const prevCount = useRef(0);

useEffect(() => {
const q = query(collection(db, “chats”, chatId, “messages”), orderBy(“ts”));
const unsub = onSnapshot(q, (snap) => {
const all = snap.docs.map((d) => ({ id: d.id, …d.data() }));
if (all.length > prevCount.current) {
const newMsgs = all.slice(prevCount.current);
if (newMsgs.some((m) => m.sender === “user”)) playNotificationSound();
}
prevCount.current = all.length;
setMsgs(all);
setTimeout(() => endRef.current?.scrollIntoView({ behavior: “smooth” }), 100);
});
return unsub;
}, [chatId]);

async function send() {
if (!text.trim()) return;
await addDoc(collection(db, “chats”, chatId, “messages”), {
text: text.trim(), sender: “admin”, ts: serverTimestamp(),
});
setText(””);
}

return (
<>
<div style={{ padding: “12px 18px”, borderBottom: `1px solid ${G.border}` }}>
<p style={{ fontFamily: G.display, fontWeight: 700, fontSize: 13 }}>Live Chat</p>
</div>
<div style={{ flex: 1, overflowY: “auto”, padding: 16, display: “flex”, flexDirection: “column”, gap: 10 }}>
{msgs.length === 0 && <p style={{ color: G.muted, fontSize: 12, textAlign: “center”, marginTop: 30 }}>No messages yet</p>}
{msgs.map((m) => (
<div key={m.id} className={m.sender === “admin” ? “chat-bubble-user” : “chat-bubble-admin”}>
<p style={{ fontSize: 12, color: G.muted, marginBottom: 3 }}>{m.sender === “admin” ? “You” : “User”}</p>
<p style={{ fontSize: 13 }}>{m.text}</p>
</div>
))}
<div ref={endRef} />
</div>
<div style={{ padding: 12, borderTop: `1px solid ${G.border}`, display: “flex”, gap: 8 }}>
<input placeholder=“Reply…” value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === “Enter” && send()} style={{ flex: 1 }} />
<Btn onClick={send} size="sm">Send</Btn>
</div>
</>
);
}

// ── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
const [authState, setAuthState] = useState({ loading: true, uid: null, isAdmin: false });

useEffect(() => {
const unsub = onAuthStateChanged(auth, async (user) => {
if (user) {
const isAdmin = user.email === ADMIN_EMAIL;
setAuthState({ loading: false, uid: user.uid, isAdmin });
} else {
setAuthState({ loading: false, uid: null, isAdmin: false });
}
});
return unsub;
}, []);

function handleLogin(uid, isAdmin = false) {
setAuthState({ loading: false, uid, isAdmin });
}

if (authState.loading) return (
<div style={{ minHeight: “100vh”, background: G.bg, display: “flex”, alignItems: “center”, justifyContent: “center” }}>
<Spinner />
</div>
);

if (!authState.uid) return <AuthScreen onLogin={handleLogin} />;
if (authState.isAdmin) return <AdminDashboard adminId={authState.uid} />;
return <UserDashboard userId={authState.uid} />;
}
