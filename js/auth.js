/* Educational, device-local authentication. This is not a production security boundary. */
(() => {
  'use strict';
  const accountKey = 'hub-accounts-v1';
  const sessionKey = 'hub-session-v1';
  const storeKey = 'eggs-game-hub-v6';
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const accounts = () => {
    const value = read(accountKey, []);
    return Array.isArray(value) ? value.filter(a => a && typeof a.email === 'string' && typeof a.id === 'string') : [];
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error('Browser storage is unavailable or full. Enable local storage and try again.'); }
  };
  const normalizeEmail = value => String(value).trim().toLowerCase();
  const validation = window.HUB_VALIDATE;
  const {validEmail, validPhone, validPassword} = validation;
  const current = () => accounts().find(a => a.id === read(sessionKey, null)?.accountId) || null;
  // The password itself is never stored: we keep a random salt and SHA-256(salt + password).
  // Login hashes the typed password with the same salt and compares the two hashes.
  async function digest(password, salt) {
    if (!window.crypto?.subtle) throw new Error('Open the hosted HTTPS site or use localhost to create and access demo accounts.');
    const bytes = new TextEncoder().encode(salt + ':' + password);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('');
  }
  // Each account is linked to a storefront player, which owns the wallet, library and ratings.
  function activatePlayer(account) {
    const store = read(storeKey, null);
    if (store && Array.isArray(store.profiles) && store.profiles.some(p => p.id === account.profileId)) {
      store.active = account.profileId;
      write(storeKey, store);
    }
  }
  async function register({name, email, phone, password, profileId}) {
    name = String(name).trim(); email = normalizeEmail(email); phone = String(phone).trim();
    if (!validation.validName(name)) throw new Error(validation.nameMessage(24));
    if (!validEmail(email)) throw new Error('Enter a valid email address.');
    if (!validPhone(phone)) throw new Error('Enter a phone number with 10–15 digits.');
    if (!validPassword(password)) throw new Error(validation.passwordMessage);
    const salt = crypto.randomUUID();
    const passwordHash = await digest(password, salt);
    // Re-read after the asynchronous hash so another completed signup is retained.
    const list = accounts();
    if (list.some(a => a.email === email)) throw new Error('This email already has an account. Log in instead.');
    const account = {id:crypto.randomUUID(), name, email, phone, passwordHash, salt, profileId, createdAt:new Date().toISOString()};
    write(accountKey, [...list, account]);
    write(sessionKey, {accountId:account.id});
    return account;
  }
  // Updates the header account link and, on profile.html, fills in the stored account details.
  function refreshUI() {
    const account = current();
    document.querySelectorAll('[data-account-link]').forEach(link => {
      link.textContent = account ? 'My profile' : 'Log in';
      link.href = account ? 'profile.html' : 'login.html';
      link.setAttribute('aria-label', account ? `Open ${account.name}'s account profile` : 'Log in to your account');
    });
    const panel = document.querySelector('[data-account-profile]');
    if (!panel) return;
    document.querySelector('[data-profile-gate]').hidden = Boolean(account);
    panel.hidden = !account;
    if (!account) return;
    const details = {'account-name':account.name,'account-avatar':account.name.charAt(0).toUpperCase(),'detail-name':account.name,'detail-email':account.email,'detail-phone':account.phone,'detail-date':new Intl.DateTimeFormat('en-GB',{dateStyle:'long'}).format(new Date(account.createdAt))};
    for (const [key, value] of Object.entries(details)) document.querySelector(`[data-${key}]`).textContent = value;
    const store = read(storeKey, null);
    const player = store?.profiles?.find(p => p.id === account.profileId);
    document.querySelector('[data-profile-owned]').textContent = player?.owned?.length || 0;
    document.querySelector('[data-profile-rated]').textContent = Object.keys(player?.ratings || {}).length;
    document.querySelector('[data-profile-balance]').textContent = '$' + ((player?.balance ?? 10000) / 100).toFixed(2);
  }
  window.HUB_AUTH = {register, current, refreshUI, validEmail, validPhone, validPassword, emailExists:email => accounts().some(a => a.email === normalizeEmail(email))};
  refreshUI();
  if (document.querySelector('[data-account-profile]') && current()) {
    try { activatePlayer(current()); } catch {}
  }
  document.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', () => {
    try { localStorage.removeItem(sessionKey); location.href = 'login.html'; }
    catch { button.textContent = 'Could not log out. Enable browser storage.'; }
  }));
  document.querySelectorAll('[data-toggle-password]').forEach(button => button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword);
    const show = input.type === 'password'; input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Hide' : 'Show'; button.setAttribute('aria-pressed', String(show));
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));
  const login = document.querySelector('#login-form');
  if (login) {
    let busy = false;
    login.querySelectorAll('input').forEach(field => field.setAttribute('aria-required','true'));
    const setError = (id, message) => {
      const input = document.getElementById(id), error = document.getElementById(id + '-error');
      error.textContent = message; error.hidden = !message; input.classList.toggle('is-invalid', Boolean(message));
      input.setAttribute('aria-invalid', String(Boolean(message)));
    };
    login.addEventListener('input', event => {
      if (['login-email','login-password'].includes(event.target.id)) setError(event.target.id, '');
      login.querySelector('.form-status').textContent = '';
    });
    login.addEventListener('submit', async event => {
      event.preventDefault(); if (busy) return;
      const email = normalizeEmail(login.elements.email.value), password = login.elements.password.value;
      setError('login-email', !email ? 'Enter your email address.' : !validEmail(email) ? 'Enter a valid email, such as player@example.com.' : '');
      setError('login-password', !password.trim() ? 'Enter your password.' : !validPassword(password) ? validation.passwordMessage : '');
      const invalid = login.querySelector('[aria-invalid="true"]');
      if (invalid) { invalid.focus(); return; }
      const status = login.querySelector('.form-status'), submit = login.querySelector('[type="submit"]');
      busy = true; submit.disabled = true; login.setAttribute('aria-busy','true'); status.textContent = 'Checking your local account…';
      try {
        const account = accounts().find(a => a.email === email);
        if (!account || await digest(password, account.salt) !== account.passwordHash) throw new Error('Email or password is incorrect. Create an account here first if you are using a new browser.');
        activatePlayer(account); write(sessionKey, {accountId:account.id});
        location.href = 'profile.html';
      } catch (error) { status.textContent = error.message; status.dataset.state = 'error'; }
      finally { busy = false; submit.disabled = false; login.removeAttribute('aria-busy'); }
    });
  }
  window.addEventListener('storage', refreshUI);
  window.addEventListener('pageshow', refreshUI);
  // The storefront's ready handler may update the wallet after this script runs.
  document.addEventListener('DOMContentLoaded', () => setTimeout(refreshUI, 50));
})();
