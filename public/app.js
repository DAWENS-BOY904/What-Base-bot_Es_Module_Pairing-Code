// public/app.js
// Handles login/signup requests from frontend and auth flows
async function postJson(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  return res.json();
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[name="email"]').value.trim();
    const password = loginForm.querySelector('input[name="password"]').value;
    const remember = loginForm.querySelector('input[name="remember"]').checked;
    const msg = document.getElementById('loginMsg');
    msg.textContent = 'Signing in...';
    try {
      const res = await postJson('/api/login', { email, password, remember });
      if (res.ok) {
        msg.style.color = 'green';
        msg.textContent = 'Signed in — redirecting…';
        setTimeout(()=> location.href = '/', 700);
      } else {
        msg.style.color = 'crimson';
        msg.textContent = res.error || 'Login failed';
      }
    } catch (err) {
      msg.style.color = 'crimson';
      msg.textContent = 'Network error';
    }
  });
}

// SIGNUP
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = signupForm.querySelector('input[name="username"]').value.trim();
    const email = signupForm.querySelector('input[name="email"]').value.trim();
    const phone = signupForm.querySelector('input[name="phone"]').value.trim();
    const password = signupForm.querySelector('input[name="password"]').value;
    const msg = document.getElementById('signupMsg');
    msg.textContent = 'Creating account...';
    try {
      const res = await postJson('/api/signup', { username, email, phone, password });
      if (res.ok) {
        msg.style.color = 'green';
        msg.textContent = 'Account created — please sign in.';
      } else {
        msg.style.color = 'crimson';
        msg.textContent = res.error || 'Failed to create account';
      }
    } catch (err) {
      msg.style.color = 'crimson';
      msg.textContent = 'Network error';
    }
  });
}