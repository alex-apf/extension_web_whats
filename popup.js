document.addEventListener('DOMContentLoaded', () => {
  const keywordInput = document.getElementById('keyword');
  const responseInput = document.getElementById('response');
  const statusEl = document.getElementById('status');

  chrome.storage.local.get(['keyword', 'response'], data => {
    if (data.keyword) keywordInput.value = data.keyword;
    if (data.response) responseInput.value = data.response;
    console.log('[AutoResponder Popup] Loaded config', data);
  });

  document.getElementById('save').addEventListener('click', () => {
    const toSave = {
      keyword: keywordInput.value.trim(),
      response: responseInput.value.trim()
    };
    console.log('[AutoResponder Popup] Saving config', toSave);
    chrome.storage.local.set(toSave, () => {
      statusEl.textContent = 'Guardado';
      setTimeout(() => { statusEl.textContent = ''; }, 1500);
    });
  });
});
