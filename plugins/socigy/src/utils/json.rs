use serde::Deserialize;
use wasm_bindgen::prelude::JsValue;

pub fn parse_json<T>(json_string: &str) -> Result<T, JsValue>
where
    T: for<'de> Deserialize<'de>,
{
    serde_json::from_str(json_string)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse JSON: {}", e)))
}
