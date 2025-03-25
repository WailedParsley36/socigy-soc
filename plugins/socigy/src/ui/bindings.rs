use std::{cell::RefCell, collections::HashMap, rc::Rc};

use crate::{info, logging};

use super::{
    components::{ComponentInstance, UIComponent},
    renderer::Renderer,
};
use uuid::Uuid;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(js_namespace = ["socigy", "ui"])]
extern "C" {
    #[wasm_bindgen(js_name = "registerComponent")]
    fn internal_register_component(id: String);
    #[wasm_bindgen(js_name = "removeComponent")]
    fn internal_remove_component(id: String);
}

thread_local! {
    static COMPONENTS: Rc<RefCell<HashMap<String, Renderer>>> = Rc::new(RefCell::new(HashMap::new()));
}

pub fn remove_component(id: &Uuid) {
    COMPONENTS.with(|value| {
        value.borrow_mut().remove(&id.to_string());
    });

    internal_remove_component(id.to_string());
}

pub fn register_component<T>(id: &Uuid)
where
    T: UIComponent + 'static,
{
    info!("Registering component with id {}", id);

    COMPONENTS.with(|value| {
        value.borrow_mut().insert(
            id.to_string(),
            Renderer::new(
                *id,
                Box::new(ComponentInstance::<T> {
                    component_cache: None,
                    last_props: None,
                }),
            ),
        );
    });

    internal_register_component(id.to_string());
}

#[wasm_bindgen]
pub fn render_component(id: String, props: Option<String>) -> Option<String> {
    info!("Rendering component with ID {}", id);

    COMPONENTS.with(|value| {
        value
            .borrow_mut()
            .get_mut(&id)
            .expect("The component should be registered already")
            .render(props)
    })
}
