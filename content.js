const processed = new WeakSet();
let config = { keyword: '', response: '' };

function loadConfig() {
  chrome.storage.local.get(['keyword', 'response'], data => {
    config.keyword = data.keyword || '';
    config.response = data.response || '';
  });
}

chrome.storage.onChanged.addListener(changes => {
  if (changes.keyword) config.keyword = changes.keyword.newValue || '';
  if (changes.response) config.response = changes.response.newValue || '';
});

function getMessageText(msgElem) {
  const span = msgElem.querySelector('span.selectable-text.copyable-text > span');
  return span ? span.innerText.trim() : '';
}

function sendAutoReply(text) {
  const input = document.querySelector("div[contenteditable='true'][data-tab='10']");
  const sendBtn = document.querySelector("[data-testid='send'], [data-icon='send']");
  if (!input || !sendBtn) return;
  input.focus();
  document.execCommand('insertText', false, text);
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  sendBtn.click();
}

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      const msg = node.matches('div.message-in') ? node : node.closest('div.message-in');
      if (!msg || processed.has(msg)) continue;
      processed.add(msg);
      const text = getMessageText(msg);
      if (
        text &&
        config.keyword &&
        config.response &&
        text.toLowerCase().includes(config.keyword.toLowerCase())
      ) {
        sendAutoReply(config.response);
      }
    }
  }
});

function init() {
  const chat = document.querySelector('#main');
  if (chat) {
    observer.observe(chat, { childList: true, subtree: true });
  } else {
    setTimeout(init, 1000);
  }
}

loadConfig();
init();
