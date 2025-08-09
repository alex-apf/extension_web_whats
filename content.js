// Detecta todos los mensajes entrantes observando el DOM completo
const processed = new WeakSet();
let enabled = true;

// Botón flotante ON/OFF
(function ui(){
  if (document.getElementById("whar-fab")) return;
  const b=document.createElement("div");
  b.id="whar-fab"; b.textContent="Auto: ON";
  b.style.cssText="position:fixed;right:16px;bottom:16px;z-index:999999;background:#25D366;color:#111;border-radius:20px;padding:8px 12px;font:13px system-ui;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer";
  b.onclick=()=>{ enabled=!enabled; b.textContent=enabled?"Auto: ON":"Auto: OFF"; };
  b.oncontextmenu=(e)=>{ e.preventDefault(); chrome.runtime.openOptionsPage(); };
  document.body.appendChild(b);
})();

async function getSettings(){
  const def={ triggers:[], workingHours:{enabled:false}, globalCooldownSec:0 };
  const { settings } = await chrome.storage.sync.get({ settings:def });
  return settings||def;
}
function isIncoming(node){
  const pre = node.closest('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text') || "";
  // Ejemplo: "[23:41, 06/08/2025] Tú: " -> saliente
  return !/Tú:\s*$/.test(pre) && !/You:\s*$/.test(pre);
}
function textFromBubble(root){
  // Soporta editor Lexical y spans antiguos
  const t = root.querySelector('[data-lexical-text="true"], span.selectable-text, [data-testid="msg-text"]');
  return t?.textContent?.trim() || "";
}
function composer(){
  return document.querySelector('[data-testid="conversation-compose-box-input"], [contenteditable="true"][data-lexical-editor="true"], [contenteditable="true"][data-tab="10"]');
}
function clickSend(){
  const btn = document.querySelector('[data-testid="compose-btn-send"], button[aria-label*="Send"], button[aria-label*="Enviar"]');
  if (btn){ btn.click(); return true; }
  return false;
}
function send(text){
  const box = composer(); if (!box) return false;
  box.focus();
  // 1) beforeinput/input modernos
  box.dispatchEvent(new InputEvent('beforeinput',{inputType:'insertText', data:text, bubbles:true}));
  box.dispatchEvent(new InputEvent('input',{data:text, inputType:'insertText', bubbles:true}));
  // 2) fallback execCommand
  document.execCommand('insertText', false, text);
  // 3) último recurso
  if (!box.textContent || !box.textContent.includes(text)) {
    box.textContent = text;
    box.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if (!clickSend()){
    box.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
  }
  return true;
}
function match(t, msg){
  if (t.isRegex){
    try{ return new RegExp(t.pattern, t.caseSensitive?'g':'gi').test(msg); }catch{ return false; }
  }
  return t.caseSensitive ? msg.includes(t.pattern) : msg.toLowerCase().includes((t.pattern||"").toLowerCase());
}

(async function main(){
  let settings = await getSettings();
  chrome.storage.onChanged.addListener((c,a)=>{ if(a==='sync' && c.settings){ settings=c.settings.newValue; }});

  const obs = new MutationObserver(() => {
    if (!enabled) return;
    // Cada burbuja de mensaje trae data-pre-plain-text en un ancestro .copyable-text
    document.querySelectorAll('div.copyable-text[data-pre-plain-text]').forEach(ct=>{
      if (processed.has(ct)) return;
      const msg = textFromBubble(ct); if (!msg) return;
      if (!isIncoming(ct)) { processed.add(ct); return; }

      for (const t of (settings.triggers||[]).filter(x=>x.enabled!==false)) {
        if (match(t, msg)) {
          if (send(t.reply)) processed.add(ct);
          break;
        }
      }
    });
  });

  // Observa TODO. Esto captura mensajes aunque la lista esté virtualizada.
  obs.observe(document.body, { childList:true, subtree:true });
})();
