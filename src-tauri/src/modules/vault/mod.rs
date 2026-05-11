use notify::{RecursiveMode, Watcher};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, FileIdMap};
use serde::Serialize;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

// ── Event type emitted to the frontend ───────────────────────────────────────

/// Typed FS event emitted on the `vault://fs-event` channel.
///
/// The frontend strips the vault-root prefix from the paths; Rust emits
/// whatever absolute paths `notify` gives us.
#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum FsEvent {
    Create { path: String },
    Modify { path: String },
    Remove { path: String },
    Rename { from: String, to: String },
}

// ── Managed state ─────────────────────────────────────────────────────────────

/// Holds the active debouncer (and therefore the active OS watch handle).
/// Dropping the inner `Some` stops the watch.
pub struct VaultState {
    debouncer: Mutex<Option<Debouncer<notify::RecommendedWatcher, FileIdMap>>>,
}

impl Default for VaultState {
    fn default() -> Self {
        Self {
            debouncer: Mutex::new(None),
        }
    }
}

// ── Tauri commands ────────────────────────────────────────────────────────────

/// Open a vault at `path`. Starts a 200ms-debounced, recursive FS watcher.
/// Creates `<path>/.oasis/` if it doesn't exist.
/// Replaces any previously open vault (the prior watcher is stopped first).
#[tauri::command]
pub fn vault_open(app: AppHandle, path: String) -> Result<(), String> {
    let root = Path::new(&path);
    if !root.is_dir() {
        return Err(format!("not a directory: {path}"));
    }

    // Ensure the .oasis cache directory exists.
    let oasis_dir = root.join(".oasis");
    if !oasis_dir.exists() {
        fs::create_dir_all(&oasis_dir).map_err(|e| e.to_string())?;
    }

    let state = app.state::<VaultState>();
    let mut slot = state.debouncer.lock().map_err(|e| e.to_string())?;

    // Drop any existing watcher before creating the new one.
    *slot = None;

    let app_handle = app.clone();
    let mut debouncer = new_debouncer(
        Duration::from_millis(200),
        None,
        move |result: DebounceEventResult| match result {
            Ok(events) => {
                for ev in events {
                    if let Some(fs_event) = classify(&ev.event) {
                        let _ = app_handle.emit("vault://fs-event", &fs_event);
                    }
                }
            }
            Err(errors) => {
                for e in errors {
                    log::warn!("vault watcher error: {e:?}");
                }
            }
        },
    )
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(root, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *slot = Some(debouncer);
    Ok(())
}

/// Stop the active vault watcher.
#[tauri::command]
pub fn vault_close(app: AppHandle) -> Result<(), String> {
    let state = app.state::<VaultState>();
    let mut slot = state.debouncer.lock().map_err(|e| e.to_string())?;
    *slot = None;
    Ok(())
}

/// Read `<vault_root>/.oasis/index.json`.
/// Returns `Ok(None)` if the file does not exist yet.
/// Returns `Ok(Some(raw_json))` otherwise — the frontend owns the schema.
#[tauri::command]
pub fn vault_load_index(vault_root: String) -> Result<Option<String>, String> {
    let p = Path::new(&vault_root).join(".oasis").join("index.json");
    if !p.exists() {
        return Ok(None);
    }
    fs::read_to_string(p).map(Some).map_err(|e| e.to_string())
}

/// Write raw JSON to `<vault_root>/.oasis/index.json`.
/// Ensures the `.oasis/` directory exists before writing.
#[tauri::command]
pub fn vault_save_index(vault_root: String, json: String) -> Result<(), String> {
    let dir = Path::new(&vault_root).join(".oasis");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join("index.json"), json).map_err(|e| e.to_string())
}

// ── Event classification ──────────────────────────────────────────────────────

/// Map a raw `notify::Event` to our typed `FsEvent`.
///
/// Events under `.oasis/` are silently dropped so writes to
/// `index.json` never cause a feedback loop back into the frontend.
fn classify(ev: &notify::Event) -> Option<FsEvent> {
    use notify::EventKind;

    // Drop events for any path whose first component is `.oasis/`.
    // We check every path in the event so rename events (two paths) are also
    // filtered correctly if either side touches the cache dir.
    if ev.paths.iter().any(|p| path_is_under_oasis(p)) {
        return None;
    }

    // Helper: returns the absolute path of the first event path, or None if
    // the event has no paths (shouldn't happen in practice, but guard anyway).
    let first_path = || -> Option<String> {
        Some(ev.paths.first()?.to_string_lossy().into_owned())
    };

    match ev.kind {
        EventKind::Create(_) => Some(FsEvent::Create { path: first_path()? }),

        EventKind::Modify(notify::event::ModifyKind::Name(_)) if ev.paths.len() == 2 => {
            Some(FsEvent::Rename {
                from: ev.paths[0].to_string_lossy().into_owned(),
                to: ev.paths[1].to_string_lossy().into_owned(),
            })
        }

        EventKind::Modify(_) => Some(FsEvent::Modify { path: first_path()? }),

        EventKind::Remove(_) => Some(FsEvent::Remove { path: first_path()? }),

        _ => None,
    }
}

/// Returns `true` if any component of the path is `.oasis`.
/// This catches both `/vault/.oasis/index.json` and the `.oasis` dir itself.
fn path_is_under_oasis(p: &Path) -> bool {
    p.components().any(|c| c.as_os_str() == ".oasis")
}
