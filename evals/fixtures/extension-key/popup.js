const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
document.getElementById('title').textContent = tab.title;

const key = `note:${tab.url}`;
const note = document.getElementById('note');
note.value = (await chrome.storage.local.get(key))[key] ?? '';
note.addEventListener('input', () =>
  chrome.storage.local.set({ [key]: note.value }),
);
