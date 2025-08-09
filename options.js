const uid = () => crypto.randomUUID();

async function load() {
  const { settings } = await chrome.storage.sync.get({ settings: def() });
  render(settings);
}
function def() {
  return { triggers: [], workingHours: { enabled: false }, globalCooldownSec: 0 };
}
function render(s) {
  const list = document.getElementById("list");
  list.innerHTML = "";
  s.triggers.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.enabled !== false ? "✅" : "⛔"} ${t.pattern} → ${t.reply.slice(0,60)}`;
    const toggle = document.createElement("button"); toggle.textContent = t.enabled !== false ? "Desactivar" : "Activar";
    const del = document.createElement("button"); del.textContent = "Eliminar";
    toggle.onclick = async () => { t.enabled = !(t.enabled !== false); await save(s); render(s); };
    del.onclick = async () => { s.triggers = s.triggers.filter(x => x.id !== t.id); await save(s); render(s); };
    list.append(li, toggle, del);
  });

  document.getElementById("new").onsubmit = async e => {
    e.preventDefault();
    const t = {
      id: uid(),
      pattern: document.getElementById("pattern").value.trim(),
      reply: document.getElementById("reply").value,
      isRegex: document.getElementById("isRegex").checked,
      caseSensitive: document.getElementById("caseSensitive").checked,
      inGroups: document.getElementById("inGroups").value,
      cooldownSec: parseInt(document.getElementById("cooldown").value || "0", 10),
      enabled: true
    };
    s.triggers.push(t);
    await save(s);
    e.target.reset();
    render(s);
  };
}
function save(s) { return chrome.storage.sync.set({ settings: s }); }
load();
