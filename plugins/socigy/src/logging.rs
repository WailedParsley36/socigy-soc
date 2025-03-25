use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::date_now_format_time;

#[wasm_bindgen(js_namespace = ["socigy", "logging"])]
extern "C" {
    #[wasm_bindgen(js_name = log)]
    fn internal_log(message: JsValue);

    #[wasm_bindgen(js_name = error)]
    fn internal_error(message: JsValue, show_alert: bool, ui_delay: Option<u32>);

    #[wasm_bindgen(js_name = fatal)]
    fn internal_fatal(message: JsValue, ui_delay: Option<u32>);
}

pub fn log(level: LogLevel, message: &str) {
    internal_log(JsValue::from_str(
        format!(
            "{} {}: Console => {}",
            date_now_format_time!(),
            level,
            message
        )
        .as_str(),
    ));
}

#[macro_export]
macro_rules! debug {
    ($($arg:tt)*) => {
        $crate::logging::log($crate::logging::LogLevel::Debug, &format!($($arg)*));
    };
}
#[macro_export]
macro_rules! info {
    ($($arg:tt)*) => {
        $crate::logging::log($crate::logging::LogLevel::Info, &format!($($arg)*));
    };
}
#[macro_export]
macro_rules! warn {
    ($($arg:tt)*) => {
        $crate::logging::log($crate::logging::LogLevel::Warn, &format!($($arg)*));
    };
}
#[macro_export]
macro_rules! error {
    ($($arg:tt)*) => {
        $crate::logging::adv_error(&format!($($arg)*), None, true);
    };
}
#[macro_export]
macro_rules! fatal {
    ($($arg:tt)*) => {
        $crate::logging::adv_fatal(&format!($($arg)*), None);
    };
}

pub fn adv_error(message: &str, ui_delay: Option<u32>, show_alert: bool) {
    internal_error(
        JsValue::from_str(
            format!("{} ERROR: Console => {}", date_now_format_time!(), message).as_str(),
        ),
        show_alert,
        ui_delay,
    );
}
pub fn adv_fatal(message: &str, ui_delay: Option<u32>) {
    internal_error(
        JsValue::from_str(
            format!("{} FATAL: Console => {}", date_now_format_time!(), message).as_str(),
        ),
        false,
        None,
    );

    internal_fatal(JsValue::from_str(message), ui_delay);
}

#[derive(PartialEq)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
    Fatal,
}
impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            LogLevel::Debug => write!(f, "DEBUG"),
            LogLevel::Info => write!(f, " INFO"),
            LogLevel::Warn => write!(f, " WARN"),
            LogLevel::Error => write!(f, "\x1b[31mERROR\x1b[0m"),
            LogLevel::Fatal => write!(f, "\x1b[31mFATAL\x1b[0m"),
        }
    }
}

pub struct Logger {
    name: String,
    level: LogLevel,
}
impl Logger {
    pub fn new(name: Option<String>, level: LogLevel) -> Logger {
        let name = match name {
            Some(name) => name,
            None => String::from("Default"),
        };

        Logger { name, level }
    }

    pub fn log(&self, message: &str) {
        if self.level == LogLevel::Debug {
            internal_log(JsValue::from_str(
                format!(
                    "{} {}: {} => {}",
                    date_now_format_time!(),
                    self.level,
                    self.name,
                    message
                )
                .as_str(),
            ));
        }
    }
}
