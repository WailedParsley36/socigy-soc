use serde::Deserialize;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::invoke_native_for_user_consumption;

#[wasm_bindgen(js_namespace = ["socigy", "permissions"])]
extern "C" {
    #[wasm_bindgen(js_name = getPermissionsAsync)]
    fn internal_get_permissions_async(callbackId: String);

    #[wasm_bindgen(js_name = getDeclaredPermissions)]
    fn internal_get_declared_permissions_async(callbackId: String);

    #[wasm_bindgen(js_name = requestPermissionsAsync)]
    fn internal_request_permissions_async(callbackId: String, permissions: JsValue);
}

#[derive(Debug, Deserialize)]
pub struct PermissionState {
    name: String,
    granted: bool,
    #[serde(rename = "canAskAgain")]
    can_ask_again: bool,
}
impl PermissionState {
    pub fn new(name: String, granted: bool, can_ask_again: bool) -> PermissionState {
        PermissionState {
            name,
            granted,
            can_ask_again,
        }
    }

    pub fn name(&self) -> &String {
        &self.name
    }

    pub fn granted(&self) -> bool {
        self.granted
    }

    pub fn can_ask_again(&self) -> bool {
        self.can_ask_again
    }
}

#[derive(Debug, Deserialize)]
pub struct PermissionDeclaration {
    pub name: String,
    pub description: String,
    pub required: bool,
}

pub fn get_permissions_async(callback: Box<dyn FnOnce(Vec<PermissionState>)>) {
    invoke_native_for_user_consumption!(
        internal_get_permissions_async,
        callback,
        "Failed to parse WebAssembly host provided value to Vec<PermissionState>",
    );
}

pub fn get_declared_permissions_async(callback: Box<dyn FnOnce(Vec<PermissionDeclaration>)>) {
    invoke_native_for_user_consumption!(
        internal_get_declared_permissions_async,
        callback,
        "Failed to parse WebAssembly host provided value to Vec<PermissionDeclaration>",
    );
}

/// This macro serializes the string response from the WebAssembly host to the required parameter T and passes the new value to the user callback

pub fn request_permissions_async(
    permissions: &Vec<String>,
    callback: Box<dyn FnOnce(Vec<PermissionState>)>,
) {
    invoke_native_for_user_consumption!(
        internal_request_permissions_async,
        callback,
        "Failed to parse WebAssembly host provided value to Vec<PermissionState>",
        to_value(permissions).unwrap()
    );
}

#[derive(Debug)]
pub struct PermissionError {
    pub permission: String,
    pub message: String,
}

impl std::fmt::Display for PermissionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Permission errors")
    }
}
