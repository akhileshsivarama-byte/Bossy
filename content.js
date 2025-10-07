// Utility: wait for element matching selector
function waitForSelector(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
      } else {
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(timer);
          reject(new Error("Timeout waiting for selector " + selector));
        }
      }
    }, interval);
  });
}

// Return a “chat id” for the currently open chat
function getCurrentChatId() {
  const header = document.querySelector('header');
  if (!header) return null;
  const contactNameEl = header.querySelector('span[title]');
  if (!contactNameEl) return null;
  return contactNameEl.getAttribute('title');
}

// Inject the “Notes” button if not already present
function injectNotesButton() {
  const header = document.querySelector('header');
  if (!header) return;

  if (header.querySelector('.my-notes-btn')) return;

  const btn = document.createElement('button');
  btn.innerText = 'Notes';
  btn.className = 'my-notes-btn';
  btn.style.marginLeft = '8px';
  header.appendChild(btn);

  btn.addEventListener('click', openNotesModal);
}

// Create / show the notes modal
async function openNotesModal() {
  const chatId = getCurrentChatId();
  if (!chatId) {
    alert('Cannot identify chat');
    return;
  }

  let modal = document.getElementById('notes-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'notes-modal';
    modal.innerHTML = `
      <div class="notes-overlay"></div>
      <div class="notes-popup">
        <h3>Note for ${chatId}</h3>
        <textarea id="notes-textarea" rows="8" style="width:100%"></textarea>
        <button id="notes-save-btn">Save</button>
        <button id="notes-close-btn">Close</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('notes-close-btn').onclick = () => {
      modal.style.display = 'none';
    };
    document.getElementById('notes-save-btn').onclick = async () => {
      const txt = document.getElementById('notes-textarea').value;
      await saveNoteForChat(chatId, txt);
      modal.style.display = 'none';
    };
  }

  const existing = await loadNoteForChat(chatId);
  const ta = modal.querySelector('#notes-textarea');
  ta.value = existing || '';

  modal.style.display = 'block';
}

// Save note to storage
function saveNoteForChat(chatId, text) {
  return new Promise((resolve) => {
    const obj = {};
    obj[chatId] = text;
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}

// Load note from storage
function loadNoteForChat(chatId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(chatId, (res) => {
      resolve(res[chatId]);
    });
  });
}

// Watch for chat changes
function observeChatChange() {
  const obs = new MutationObserver(() => {
    injectNotesButton();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// Entry point
(async function() {
  try {
    await waitForSelector('header');
    injectNotesButton();
    observeChatChange();
  } catch (e) {
    console.error('Failed to initialize notes extension:', e);
  }
})();