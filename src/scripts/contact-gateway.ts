// Copy email button logic
const copyBtn = document.getElementById('copy-email-btn');
const copyText = document.getElementById('copy-email-text');
const emailToCopy = 'f.riquelmesalvo@uandresbello.edu';

if (copyBtn && copyText) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailToCopy);
      const originalText = copyText.textContent;
      copyText.textContent = '¡Copiado!';
      copyBtn.classList.add('text-domain-audio', 'border-domain-audio');
      setTimeout(() => {
        copyText.textContent = originalText;
        copyBtn.classList.remove('text-domain-audio', 'border-domain-audio');
      }, 2500);
    } catch (e) {
      window.location.href = `mailto:${emailToCopy}`;
    }
  });
}

// Handle accessible form submission via fetch to /api/contact
const form = document.getElementById('contact-form') as HTMLFormElement | null;
const statusDiv = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

if (form && statusDiv && submitBtn) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusDiv.classList.remove('hidden', 'text-domain-audio', 'text-rose-400');
    statusDiv.classList.add('text-slate-300');
    statusDiv.textContent = 'Enviando mensaje y registrando telemetría...';
    submitBtn.setAttribute('disabled', 'true');

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      topic: formData.get('topic'),
      message: formData.get('message'),
      botcheck: formData.get('botcheck')
    };

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        data = { error: rawText || 'Respuesta no valida del servidor' };
      }

      if (response.ok && data.success) {
        statusDiv.classList.remove('text-slate-300');
        statusDiv.classList.add('text-domain-audio');
        statusDiv.textContent = data.message || 'Mensaje recibido con exito. Te respondere a la brevedad.';
        form.reset();
      } else {
        throw new Error(data.error || 'Error al procesar el mensaje');
      }
    } catch (err: any) {
      statusDiv.classList.remove('text-slate-300');
      statusDiv.classList.add('text-rose-400');
      statusDiv.textContent = err.message || 'No se pudo enviar automaticamente. Por favor escribeme directamente a f.riquelmesalvo@uandresbello.edu.';
    } finally {
      submitBtn.removeAttribute('disabled');
    }
  });
}
