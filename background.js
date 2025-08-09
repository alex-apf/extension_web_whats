// Siempre permite responder de inmediato
chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg.type === "shouldReply") { sendResponse({ ok: true }); return true; }
});
