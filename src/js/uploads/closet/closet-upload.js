export async function setupClosetUploadUI() {
  const upload = document.getElementById('upload-sections');
  const dash = document.getElementById('dashboard-sections');

  try {
    // Put your real partial paths here
    const [formHtml, dashHtml] = await Promise.all([
      fetch('/components/uploads/closet-form.html', { cache: 'no-store' }).then(r => r.ok ? r.text() : ''),
      fetch('/components/uploads/closet-dashboard.html', { cache: 'no-store' }).then(r => r.ok ? r.text() : '')
    ]);

    if (upload) upload.innerHTML = formHtml || `<div class="empty-hint">Closet form partial not found.</div>`;
    if (dash) dash.innerHTML   = dashHtml  || '';
  } catch (err) {
    console.error('[closet] failed injecting sections:', err);
  }
}
