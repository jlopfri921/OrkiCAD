//! Build a deterministic development Windows application icon so a clean
//! source checkout can compile without manually preparing binary assets.
//! Production releases must replace this generated placeholder with the
//! approved OrkiCAD brand logo and platform-specific icon assets.

use std::{fs, path::Path};

fn create_windows_dev_icon() -> std::io::Result<()> {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("icons")
        .join("icon.ico");
    if path.is_file() {
        return Ok(());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    const SIZE: usize = 32;
    let mut dib = Vec::with_capacity(40 + SIZE * SIZE * 4 + SIZE * 4);
    // 40-byte BITMAPINFOHEADER. ICO stores a doubled height (color + mask).
    dib.extend_from_slice(&40u32.to_le_bytes());
    dib.extend_from_slice(&(SIZE as i32).to_le_bytes());
    dib.extend_from_slice(&((SIZE * 2) as i32).to_le_bytes());
    dib.extend_from_slice(&1u16.to_le_bytes());
    dib.extend_from_slice(&32u16.to_le_bytes());
    dib.extend_from_slice(&0u32.to_le_bytes());
    dib.extend_from_slice(&((SIZE * SIZE * 4 + SIZE * 4) as u32).to_le_bytes());
    dib.extend_from_slice(&0i32.to_le_bytes());
    dib.extend_from_slice(&0i32.to_le_bytes());
    dib.extend_from_slice(&0u32.to_le_bytes());
    dib.extend_from_slice(&0u32.to_le_bytes());

    for y in 0..SIZE {
        for x in 0..SIZE {
            // Bottom-up BGRA. Compact teal CAD emblem, with a subtle diamond.
            let dx = (x as i32 - 15).abs();
            let dy = (y as i32 - 15).abs();
            let rim = dx + dy;
            let (b, g, r) = if (10..=19).contains(&rim) {
                (223u8, 226u8, 94u8)
            } else if rim < 10 {
                (88u8, 174u8, 35u8)
            } else {
                (31u8, 23u8, 13u8)
            };
            dib.extend_from_slice(&[b, g, r, 255u8]);
        }
    }
    // 1bpp AND mask rows padded to 32-bit boundaries: zero = fully opaque.
    dib.resize(dib.len() + SIZE * 4, 0);

    let mut ico = Vec::with_capacity(22 + dib.len());
    ico.extend_from_slice(&0u16.to_le_bytes()); // Reserved
    ico.extend_from_slice(&1u16.to_le_bytes()); // Icon type
    ico.extend_from_slice(&1u16.to_le_bytes()); // One image
    ico.push(SIZE as u8);
    ico.push(SIZE as u8);
    ico.push(0);
    ico.push(0);
    ico.extend_from_slice(&1u16.to_le_bytes());
    ico.extend_from_slice(&32u16.to_le_bytes());
    ico.extend_from_slice(&(dib.len() as u32).to_le_bytes());
    ico.extend_from_slice(&22u32.to_le_bytes());
    ico.extend_from_slice(&dib);
    fs::write(&path, ico)?;
    println!("cargo:warning=Generated development icon at {}", path.display());
    Ok(())
}

fn main() {
    if cfg!(target_os = "windows") {
        create_windows_dev_icon().expect("could not generate desktop development icon");
    }
    tauri_build::build();
}
