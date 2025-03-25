use std::panic;

use crate::logging::{adv_fatal, log};
use wasm_bindgen::prelude::wasm_bindgen;

fn register_panic_handler() {
    panic::set_hook(Box::new(|info| {
        let location = info.location().expect("There was no location info!");
        adv_fatal(
            (format!(
                "{:#?}\r\nPlugin panicked at {}",
                info.payload()
                    .downcast_ref::<String>()
                    .unwrap_or(&"No panic message available".to_string()),
                format!(
                    "{}:{}:{}",
                    location.file(),
                    location.line(),
                    location.column()
                )
            ))
            .as_str(),
            None,
        );
    }));
}

#[wasm_bindgen]
pub fn initialize() {
    // Simulate some asynchronous work
    log(
        crate::logging::LogLevel::Info,
        "Initializing Socigy Rust Core",
    );
    register_panic_handler();
    log(
        crate::logging::LogLevel::Info,
        "Initialized Socigy Rust Core",
    );
}
