use std::fs;
use std::path::PathBuf;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_opener::OpenerExt;

const DATA_FILE: &str = "fini.json";
const BACKUP_FILE: &str = "fini.backup.json";
/// Argument passé par le lancement automatique avec Windows.
const AUTOSTART_ARG: &str = "--autostart";

/// `Documents\Fini`, créé si besoin.
fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .document_dir()
        .map_err(|e| e.to_string())?
        .join("Fini");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[tauri::command]
fn load_data(app: AppHandle) -> Result<Option<String>, String> {
    let path = data_dir(&app)?.join(DATA_FILE);
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
}

/// Écriture atomique : on écrit un fichier temporaire puis on le renomme,
/// pour ne jamais laisser un fini.json à moitié écrit en cas de coupure.
#[tauri::command]
fn save_data(app: AppHandle, contents: String) -> Result<(), String> {
    let dir = data_dir(&app)?;
    let tmp = dir.join("fini.json.tmp");
    fs::write(&tmp, contents).map_err(|e| e.to_string())?;
    fs::rename(&tmp, dir.join(DATA_FILE)).map_err(|e| e.to_string())
}

#[tauri::command]
fn data_file_path(app: AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.join(DATA_FILE).display().to_string())
}

#[tauri::command]
fn open_data_dir(app: AppHandle) -> Result<(), String> {
    let dir = data_dir(&app)?;
    app.opener()
        .open_path(dir.display().to_string(), None::<&str>)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn launched_at_startup() -> bool {
    std::env::args().any(|a| a == AUTOSTART_ARG)
}

#[tauri::command]
fn quit(app: AppHandle) {
    app.exit(0);
}

/// Copie de sécurité du fichier de données, une fois par lancement.
fn backup(app: &AppHandle) {
    if let Ok(dir) = data_dir(app) {
        let data = dir.join(DATA_FILE);
        if data.exists() {
            let _ = fs::copy(&data, dir.join(BACKUP_FILE));
        }
    }
}

fn show_main(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Ouvrir Fini", true, None::<&str>)?;
    let compact = MenuItem::with_id(app, "compact", "Mode compact", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &compact, &separator, &quit])?;

    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("Fini")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            // L'interface choisit la taille de fenêtre (normale ou compacte) puis l'affiche.
            "open" => {
                let _ = app.emit("tray-open", ());
            }
            "compact" => {
                let _ = app.emit("tray-compact", ());
            }
            // L'interface enregistre ce qui reste à sauvegarder avant de quitter.
            "quit" => {
                let _ = app.emit("tray-quit", ());
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Doit être le premier plugin : un deuxième lancement réaffiche simplement la fenêtre existante.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main(app);
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![AUTOSTART_ARG]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            backup(app.handle());
            build_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            data_file_path,
            open_data_dir,
            launched_at_startup,
            quit
        ])
        .run(tauri::generate_context!())
        .expect("impossible de lancer Fini");
}
