use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_namespace = ["socigy", "ui", "render"])]
extern "C" {
    #[wasm_bindgen(js_name = "processComponentRenderChanges")]
    pub fn process_component_render_changes(id: String, changes: String);
}
