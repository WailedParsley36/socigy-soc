use serde::{de::DeserializeOwned, Serialize};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::permissions::PermissionError;

#[wasm_bindgen(js_namespace = ["socigy", "internet"])]
extern "C" {
    #[wasm_bindgen(js_name = "fetch")]
    fn internal_fetch(url: String, options: String);
}

#[derive(Serialize)]
pub struct FetchOptions {}

#[derive(Debug)]
pub enum FetchError {
    AccessDenied(PermissionError),
}

pub fn fetch<T>() -> Result<T, FetchError>
where
    T: DeserializeOwned,
{
    Err(FetchError::AccessDenied(PermissionError {
        permission: "socigy.internet".into(),
        message: "Permission was not allowed".into(),
    }))
}
