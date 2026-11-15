//! OrkiCAD Desktop shell: same React Studio frontend as the browser edition.
//! Local CAD jobs stay in the allowlisted Python Core worker, NEVER in the UI.
//! This is a development bridge: production packaging of native OCCT/OpenSCAD
//! and secure user-credential storage is a separate release gate.

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use serde_json::Value;
use std::{
    net::TcpListener,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::{Manager, State};

struct StudioWorker {
    child: Mutex<Child>,
    base_url: String,
    token: String,
}

impl Drop for StudioWorker {
    fn drop(&mut self) {
        if let Ok(mut process) = self.child.lock() {
            let _ = process.kill();
            let _ = process.wait();
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StudioReply {
    status: u16,
    content_type: String,
    body_base64: String,
}

const ALLOWED_ROUTES: &[&str] = &[
    "/api/health",
    "/api/catalog",
    "/api/providers",
    "/api/ollama/models",
    "/api/scad",
    "/api/stl",
    "/api/3mf",
    "/api/step",
    "/api/interpret",
];

#[tauri::command]
fn studio_request(
    state: State<'_, StudioWorker>,
    path: String,
    method: String,
    payload: Option<Value>,
) -> Result<StudioReply, String> {
    if !ALLOWED_ROUTES.contains(&path.as_str()) {
        return Err("Unsupported OrkiCAD API route".into());
    }
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(190))
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "Could not initialize private CAD transport")?;
    let url = format!("{}{}", state.base_url, path);
    let builder = match method.as_str() {
        "GET" if payload.is_none() => client.get(url),
        "POST" if payload.is_some() => client.post(url).json(&payload),
        _ => return Err("Invalid CAD request method or missing payload".into()),
    };
    let reply = builder
        .header("X-OrkiCAD-Client", "studio")
        .header("X-OrkiCAD-Token", &state.token)
        .send()
        .map_err(|_| "OrkiCAD local CAD worker is not responding")?;
    let status = reply.status().as_u16();
    let content_type = reply
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|header| header.to_str().ok())
        .unwrap_or("application/octet-stream")
        .to_owned();
    let bytes = reply
        .bytes()
        .map_err(|_| "Could not read local CAD worker response")?;
    if bytes.len() > 55 * 1024 * 1024 {
        return Err("CAD worker response exceeds application limit".into());
    }
    Ok(StudioReply {
        status,
        content_type,
        body_base64: STANDARD.encode(bytes),
    })
}

fn locate_worker(app: &tauri::App) -> Result<(PathBuf, Vec<String>, Option<PathBuf>), String> {
    // A packaged application must contain its own self-sufficient CAD worker.
    if let Ok(resources) = app.path().resource_dir() {
        let worker = if cfg!(windows) {
            resources.join("orkicad-runtime").join("orkicad-worker.exe")
        } else {
            resources.join("orkicad-runtime").join("orkicad-worker")
        };
        if worker.is_file() {
            return Ok((worker, Vec::new(), None));
        }
    }

    if !cfg!(debug_assertions) {
        return Err(
            "Bundled OrkiCAD CAD runtime was not found; installation is incomplete."
                .to_string(),
        );
    }
    // Development only: automatically find the project Python, never ask
    // users for absolute Python/FreeCAD paths.
    let project = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .map_err(|_| "Could not locate OrkiCAD project directory")?;
    let candidates = if cfg!(windows) {
        vec![
            project.join(".venv-occt/Scripts/python.exe"),
            project.join(".venv/Scripts/python.exe"),
        ]
    } else {
        vec![
            project.join(".venv-occt/bin/python"),
            project.join(".venv/bin/python"),
        ]
    };
    let python = candidates
        .into_iter()
        .find(|path| path.is_file())
        .ok_or(
            "Development Python runtime not found. Install OrkiCAD Core in .venv-occt or .venv."
                .to_string(),
        )?;
    Ok((
        python,
        vec!["-m".into(), "orkicad_core.studio_server".into()],
        Some(project),
    ))
}

fn start_worker(app: &tauri::App) -> Result<StudioWorker, String> {
    let (program, arguments, directory) = locate_worker(app)?;
    let socket = TcpListener::bind("127.0.0.1:0")
        .map_err(|_| "Could not reserve a loopback CAD port")?;
    let port = socket
        .local_addr()
        .map_err(|_| "Could not inspect reserved CAD port")?
        .port();
    drop(socket);
    let token = uuid::Uuid::new_v4().to_string();
    let base_url = format!("http://127.0.0.1:{port}");
    let mut command = Command::new(program);
    command.args(arguments);
    command.env("ORKICAD_STUDIO_PORT", port.to_string());
    command.env("ORKICAD_STUDIO_TOKEN", &token);
    command.stdin(Stdio::null());
    command.stdout(Stdio::null());
    command.stderr(Stdio::null());
    if let Some(directory) = directory {
        command.current_dir(directory);
    }
    let mut child = command
        .spawn()
        .map_err(|_| "Could not start bundled OrkiCAD CAD worker")?;
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_millis(350))
        .no_proxy()
        .build()
        .map_err(|_| "Could not initialize CAD worker health check")?;
    let deadline = Instant::now() + Duration::from_secs(12);
    while Instant::now() < deadline {
        if let Ok(reply) = client
            .get(format!("{base_url}/api/health"))
            .header("X-OrkiCAD-Token", &token)
            .send()
        {
            if reply.status().is_success() {
                return Ok(StudioWorker {
                    child: Mutex::new(child),
                    base_url,
                    token,
                });
            }
        }
        if let Ok(Some(_)) = child.try_wait() {
            return Err("OrkiCAD CAD worker exited during startup".into());
        }
        thread::sleep(Duration::from_millis(140));
    }
    let _ = child.kill();
    let _ = child.wait();
    Err("OrkiCAD CAD worker failed its private health check".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let worker =
                start_worker(app).map_err(std::io::Error::other)?;
            app.manage(worker);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![studio_request])
        .run(tauri::generate_context!())
        .expect("OrkiCAD Studio desktop launcher failed");
}
