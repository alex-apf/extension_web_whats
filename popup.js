document.addEventListener('DOMContentLoaded', () => {
  const keywordInput = document.getElementById('keyword');
  const responseInput = document.getElementById('response');
  const statusEl = document.getElementById('status');

  chrome.storage.local.get(['keyword', 'response'], data => {
    if (data.keyword) keywordInput.value = data.keyword;
    if (data.response) responseInput.value = data.response;
  });

  document.getElementById('save').addEventListener('click', () => {
    chrome.storage.local.set({
      keyword: keywordInput.value.trim(),
      response: responseInput.value.trim()
    }, () => {
      statusEl.textContent = 'Guardado';
      setTimeout(() => { statusEl.textContent = ''; }, 1500);
    });
  });
});
