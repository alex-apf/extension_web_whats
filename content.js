const processed = new WeakSet();
let config = { keyword: '', response: '' };

function loadConfig() {
  chrome.storage.local.get(['keyword', 'response'], data => {
    config.keyword = data.keyword || '';
    config.response = data.response || '';
    console.log('[AutoResponder] Config loaded', config);
  });
}

chrome.storage.onChanged.addListener(changes => {
  if (changes.keyword) config.keyword = changes.keyword.newValue || '';
  if (changes.response) config.response = changes.response.newValue || '';
  console.log('[AutoResponder] Config updated', config);
});

function getMessageText(msgElem) {
  const span = msgElem.querySelector('span.selectable-text.copyable-text > span');
  return span ? span.innerText.trim() : '';
}

function sendAutoReply(text) {
  const input = document.querySelector("div[contenteditable='true'][data-tab='10']");
  const sendBtn = document.querySelector("[data-testid='send'], [data-icon='send']");
  console.log('[AutoResponder] Attempting to send reply:', text);
  if (!input) {
    console.error('[AutoResponder] Input field not found');
    return;
  }
  if (!sendBtn) {
    console.error('[AutoResponder] Send button not found');
    return;
  }
  try {
    input.focus();
    document.execCommand('insertText', false, text);
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    sendBtn.click();
    console.log('[AutoResponder] Reply sent');
  } catch (err) {
    console.error('[AutoResponder] Failed to send reply', err);
  }
}

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      const msg = node.matches('div.message-in') ? node : node.closest('div.message-in');
      if (!msg || processed.has(msg)) continue;
      processed.add(msg);
      const text = getMessageText(msg);
      console.log('[AutoResponder] New message detected:', text);
      if (text && config.keyword && config.response) {
        if (text.toLowerCase().includes(config.keyword.toLowerCase())) {
          console.log('[AutoResponder] Keyword matched, sending response');
          sendAutoReply(config.response);
        } else {
          console.log('[AutoResponder] Keyword not matched');
        }
      } else {
        console.log('[AutoResponder] Missing message text or config', {
          text,
          keyword: config.keyword,
          response: config.response
        });
      }
    }
  }
});

function init() {
  const chat = document.querySelector('#main');
  if (chat) {
    observer.observe(chat, { childList: true, subtree: true });
    console.log('[AutoResponder] Observer attached');
  } else {
    console.warn('[AutoResponder] Chat container not found, retrying...');
    setTimeout(init, 1000);
  }
}

loadConfig();
init();
