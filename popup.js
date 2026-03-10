const noteEditor = document.getElementById("note-editor");
const saveStatus = document.getElementById("save-status");
const currentUrlEl = document.getElementById("current-url");
const showAllBtn = document.getElementById("show-all-btn");
const backBtn = document.getElementById("back-btn");
const noteView = document.getElementById("note-view");
const allNotesView = document.getElementById("all-notes-view");
const notesList = document.getElementById("notes-list");
const noNotes = document.getElementById("no-notes");

let currentUrl = "";
let saveTimeout = null;

// Get the active tab's URL and load its note
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentUrl = tabs[0].url;
  currentUrlEl.textContent = currentUrl;
  currentUrlEl.title = currentUrl;
  loadNote(currentUrl);
});

function storageKey(url) {
  return "note:" + url;
}

function loadNote(url) {
  chrome.storage.local.get(storageKey(url), (result) => {
    noteEditor.value = result[storageKey(url)] || "";
    noteEditor.focus();
  });
}

function saveNote() {
  const text = noteEditor.value;
  const key = storageKey(currentUrl);

  if (text.trim() === "") {
    // Remove empty notes to keep storage clean
    chrome.storage.local.remove(key, () => {
      showSaved();
    });
  } else {
    chrome.storage.local.set({ [key]: text }, () => {
      showSaved();
    });
  }
}

function showSaved() {
  saveStatus.textContent = "Saved";
  setTimeout(() => {
    saveStatus.textContent = "";
  }, 1500);
}

// Auto-save on typing with debounce
noteEditor.addEventListener("input", () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveNote, 400);
});

// Show all notes view
showAllBtn.addEventListener("click", () => {
  noteView.classList.add("hidden");
  allNotesView.classList.remove("hidden");
  loadAllNotes();
});

// Back to current page view
backBtn.addEventListener("click", () => {
  allNotesView.classList.add("hidden");
  noteView.classList.remove("hidden");
});

function loadAllNotes() {
  chrome.storage.local.get(null, (all) => {
    notesList.innerHTML = "";
    const entries = Object.entries(all).filter(([k]) => k.startsWith("note:"));

    if (entries.length === 0) {
      noNotes.classList.remove("hidden");
      return;
    }
    noNotes.classList.add("hidden");

    entries.forEach(([key, text]) => {
      const url = key.slice(5); // remove "note:" prefix
      const item = document.createElement("div");
      item.className = "note-item";

      const urlLine = document.createElement("div");
      urlLine.className = "note-item-url";
      urlLine.textContent = url;

      const preview = document.createElement("div");
      preview.className = "note-item-preview";
      preview.textContent =
        text.length > 120 ? text.substring(0, 120) + "..." : text;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "\u00D7";
      deleteBtn.title = "Delete this note";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        chrome.storage.local.remove(key, () => loadAllNotes());
      });

      item.appendChild(deleteBtn);
      item.appendChild(urlLine);
      item.appendChild(preview);
      notesList.appendChild(item);
    });
  });
}
