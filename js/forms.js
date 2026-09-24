// This static assignment has no server: validate locally and explain the result.
document.querySelectorAll('[data-demo-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const status = form.querySelector('.form-status');
        status.textContent = form.classList.contains('contact-form')
            ? 'Your message is valid. This is a demo form; no message has been sent.'
            : 'Your email is valid. This is a demo form; no subscription has been created.';
    });
});
