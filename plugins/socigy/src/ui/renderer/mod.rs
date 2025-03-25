use diffs::{compare_element, VDOMChange};
use uuid::Uuid;

use crate::{info, logging};

use super::{components::AnyComponent, elements::UIElement};

mod bindings;

mod diffs;
use bindings::process_component_render_changes;

pub struct Renderer {
    id: Uuid,
    root: Box<dyn AnyComponent>,
    vdom: Option<UIElement>,
}

impl Renderer {
    pub fn new(id: Uuid, root_component: Box<dyn AnyComponent>) -> Renderer {
        Renderer {
            root: root_component,
            vdom: None,
            id,
        }
    }

    pub fn render(&mut self, props: Option<String>) -> Option<String> {
        let result_element = self.root.render(props);

        // If diff returns true, we should return the rendered UI
        if self.diff(&result_element) {
            let result = match serde_json::to_string(&result_element) {
                Ok(res) => Some(res),
                Err(e) => {
                    logging::adv_error(
                        format!("Failed to parse render result: {}", e).as_str(),
                        None,
                        false,
                    );

                    None
                }
            };

            self.vdom = result_element;
            return result;
        } else {
            self.vdom = result_element;
        }

        None
    }

    fn diff(&self, new_vdom_raw: &Option<UIElement>) -> bool {
        let old_vdom = match &self.vdom {
            Some(vdom) => vdom,
            None => {
                return true;
            }
        };

        let new_vdom = match new_vdom_raw {
            Some(vdom) => vdom,
            None => {
                process_component_render_changes(
                    self.id.to_string(),
                    serde_json::json!(VDOMChange::RemoveAll).to_string(),
                );
                return false;
            }
        };

        let mut element_index = vec![0];
        let mut changes: Vec<VDOMChange> = Vec::new();

        compare_element(&mut element_index, old_vdom, new_vdom, &mut changes);

        if changes.len() > 0 {
            let changes_json = serde_json::json!(changes).to_string();
            info!("Changes {}", changes_json);

            process_component_render_changes(self.id.to_string(), changes_json);
        }

        false
    }
}
