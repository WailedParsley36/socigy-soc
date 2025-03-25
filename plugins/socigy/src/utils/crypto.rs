use uuid::Uuid;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_namespace = ["socigy", "utils", "crypto"])]
extern "C" {
    #[wasm_bindgen(js_name = "randomV4Uuid")]
    fn internal_random_v4_uuid() -> String;
}

pub fn random_v4_uuid() -> Uuid {
    Uuid::parse_str(internal_random_v4_uuid().as_str())
        .expect("The internal function should return valid UUID")
}

pub fn random_v4_uuid_str() -> String {
    internal_random_v4_uuid()
}
