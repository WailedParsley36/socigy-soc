use components::profile_test::ProfileTest;
use socigy::{exports::*, ui::bindings::register_component, uuid::uuid};

mod components;

#[wasm_bindgen]
pub fn main() {
    register_component::<ProfileTest>(&uuid!("6396e8ae-6ff9-4676-93a9-f1fb8f140e8d"));
}
