use std::{cell::RefCell, collections::HashMap, rc::Rc};

use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::logging;

use super::UIEvent;

#[wasm_bindgen(js_namespace = ["socigy", "ui", "events"])]
extern "C" {
    #[wasm_bindgen(js_name = "addEventListener")]
    fn internal_add_event_listener(id: String, callback: JsValue);

    #[wasm_bindgen(js_name = "removeEventListener")]
    fn remove_event_listener(id: String);
}

thread_local! {
    pub(crate) static REGISTERED_EVENTS: Rc<RefCell<HashMap<String, Box<dyn FnMut(&UIEvent)>>>> = Rc::new(RefCell::new(HashMap::new()));
}

#[wasm_bindgen]
pub fn invoke_ui_event(id: String, event: String) {
    let json_res = match serde_json::from_str::<UIEvent>(event.as_str()) {
        Ok(res) => res,
        Err(e) => {
            logging::adv_error(
                format!("Failed to deserialize UIEvent -> {}", e).as_str(),
                None,
                false,
            );
            return;
        }
    };

    REGISTERED_EVENTS.with(move |events| {
        if let Some(listener) = events.borrow_mut().get_mut(&id) {
            listener(&json_res);
        }
    });
}
