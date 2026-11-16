/* All field rules live in JavaScript. HTML supplies labels and keyboard hints only. */
(() => {
  'use strict';
  const text = value => typeof value === 'string' ? value.trim() : '';
  const required = value => text(value).length > 0;
  const validName = (value, limit = 24) => {
    const name = text(value);
    return name.length > 0 && name.length <= limit && /[\p{L}\p{N}]/u.test(name) && !/[<>\x00-\x1f\x7f]/.test(name);
  };
  const validEmail = value => {
    const email = text(value);
    if (!email || email.length > 254 || /\s/.test(email)) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || local.length > 64 || !/^[a-z0-9.!#$%&'*+\-/=?^_`{|}~]+$/i.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
    const labels = domain.split('.');
    return labels.length >= 2 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) && /^[a-z]{2,63}$/i.test(labels[labels.length - 1]);
  };
  const validPhone = value => {
    const phone = text(value);
    if (!/^\+?[0-9 ()-]+$/.test(phone) || !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) return false;
    // Parentheses, if present, must enclose a complete area-code group.
    return !/[()]/.test(phone.replace(/\(\d{1,5}\)/g, ''));
  };
  const validPassword = value => typeof value === 'string' && value.length >= 8 && value.length <= 128 && !/[\x00-\x1f\x7f]/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value);
  const passwordMessage = 'Use 8–128 characters with uppercase, lowercase, a number and a symbol.';
  const phoneMessage = 'Enter a phone number with 10–15 digits, such as +7 700 123 45 67.';
  const emailMessage = 'Enter a valid email address, such as player@example.com.';
  const nameMessage = limit => `Use 1–${limit} characters, including a letter or number; no angle brackets or control characters.`;
  const validSelection = field => required(field.value) && [...field.options].some(option => option.value === field.value && !option.disabled);
  // Each form explicitly declares its important fields here, without HTML constraints.
  const formRules = {
    'contact-form': {
      name: field => !required(field.value) ? 'Enter your name.' : validName(field.value, 80) ? '' : nameMessage(80),
      email: field => !required(field.value) ? 'Enter your email address.' : validEmail(field.value) ? '' : emailMessage,
      phone: field => !required(field.value) ? 'Enter your phone number.' : validPhone(field.value) ? '' : phoneMessage,
      message: field => !required(field.value) ? 'Enter your message.' : field.value.trim().length <= 2000 ? '' : 'Keep your message within 2,000 characters.',
      'demo-check': field => field.checked ? '' : 'Please check this box to continue.',
    },
    'subscription-form': {
      subscriber_email: field => !required(field.value) ? 'Enter your email address.' : validEmail(field.value) ? '' : emailMessage,
    },
  };
  window.HUB_VALIDATE = Object.freeze({required, validName, validEmail, validPhone, validPassword, validSelection, passwordMessage, phoneMessage, emailMessage, nameMessage, formRules});
})();
