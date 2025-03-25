use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    error,
    ui::elements::{
        NativeElement, NativeElementProps, NativeElementType, UIElement, UIElementChildren,
    },
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum VDOMChange {
    AddElement {
        path: Vec<i32>,
        element: UIElement,
    },
    RemoveElement {
        path: Vec<i32>,
    },
    ReplaceElement {
        path: Vec<i32>,
        element: UIElement,
    },
    UpdateText {
        path: Vec<i32>,
        text: String,
    },
    UpdateProps {
        path: Vec<i32>,
        props: Value,
    },
    UpdateProp {
        path: Vec<i32>,
        key: String,
        value: Value,
    },
    RemoveProp {
        path: Vec<i32>,
        key: String,
    },
    RemoveProps {
        path: Vec<i32>,
    },
    UpdateChildren {
        path: Vec<i32>,
        children: Vec<UIElementChildren>,
    },
    UpdateChild {
        path: Vec<i32>,
        child: UIElementChildren,
    },
    RemoveChildren {
        path: Vec<i32>,
    },
    UpdateStyle {
        path: Vec<i32>,
        styles: HashMap<String, Value>,
    },
    RemoveAll,
}

fn external_props_as_object(external_props: Option<HashMap<String, Value>>) -> Option<Value> {
    match external_props {
        Some(val) => Some(serde_json::value::Value::Object(val.into_iter().collect())),
        None => None,
    }
}
fn native_props_as_object(native_props: Option<NativeElementProps>) -> Option<Value> {
    match native_props {
        Some(val) => match serde_json::to_value(val) {
            Ok(value) => Some(value),
            Err(_) => {
                error!("Failed to convert Native Element props to serde_json::Value");
                None
            }
        },
        None => None,
    }
}

pub fn compare_element(
    index: &mut Vec<i32>,
    old: &UIElement,
    new: &UIElement,
    changes: &mut Vec<VDOMChange>,
) {
    match (old, new) {
        (UIElement::Native(old_native), UIElement::Native(new_native)) => {
            if old_native.native_type != new_native.native_type {
                changes.push(VDOMChange::ReplaceElement {
                    path: index.clone(),
                    element: new.clone(),
                });
                return;
            }

            compare_props(
                index,
                &native_props_as_object(old_native.props.clone()),
                &native_props_as_object(new_native.props.clone()),
                changes,
            );
            compare_children(index, &old_native.children, &new_native.children, changes);
        }
        (UIElement::External(old_ext), UIElement::External(new_ext)) => {
            if old_ext.id != new_ext.id {
                changes.push(VDOMChange::ReplaceElement {
                    path: index.clone(),
                    element: new.clone(),
                });
                return;
            }

            compare_props(
                index,
                &external_props_as_object(old_ext.props.clone()),
                &external_props_as_object(new_ext.props.clone()),
                changes,
            );
            compare_children(index, &old_ext.children, &new_ext.children, changes);
        }
        _ => {
            changes.push(VDOMChange::ReplaceElement {
                path: index.clone(),
                element: new.clone(),
            });
        }
    }
}

fn compare_props(
    index: &Vec<i32>,
    old_props: &Option<serde_json::Value>,
    new_props: &Option<serde_json::Value>,
    changes: &mut Vec<VDOMChange>,
) {
    match (old_props, new_props) {
        (Some(old), Some(new)) => {
            let old_map = old
                .as_object()
                .cloned()
                .unwrap_or_else(serde_json::Map::new);
            let new_map = new
                .as_object()
                .cloned()
                .unwrap_or_else(serde_json::Map::new);

            for (key, new_value) in &new_map {
                if old_map.get(key) != Some(new_value) {
                    changes.push(VDOMChange::UpdateProp {
                        path: index.clone(),
                        key: key.clone(),
                        value: new_value.clone(),
                    });
                }
            }

            for key in old_map.keys() {
                if !&new_map.contains_key(key) {
                    changes.push(VDOMChange::RemoveProp {
                        path: index.clone(),
                        key: key.clone(),
                    });
                }
            }
        }
        (None, Some(new)) => {
            changes.push(VDOMChange::UpdateProps {
                path: index.clone(),
                props: new.clone(),
            });
        }
        (Some(_), None) => {
            changes.push(VDOMChange::RemoveProps {
                path: index.clone(),
            });
        }
        (None, None) => {}
    }
}

fn compare_children(
    parent_index: &mut Vec<i32>,
    old_children: &Option<Vec<UIElementChildren>>,
    new_children: &Option<Vec<UIElementChildren>>,
    changes: &mut Vec<VDOMChange>,
) {
    match (old_children, new_children) {
        (Some(old), Some(new)) => {
            let max_len = old.len().max(new.len());
            for i in 0..max_len {
                parent_index.push(i as i32);
                match (old.get(i), new.get(i)) {
                    (
                        Some(UIElementChildren::Element(old_elem)),
                        Some(UIElementChildren::Element(new_elem)),
                    ) => {
                        compare_element(parent_index, old_elem, new_elem, changes);
                    }
                    (Some(_), Some(_)) if old[i] != new[i] => {
                        changes.push(VDOMChange::UpdateChild {
                            path: parent_index.clone(),
                            child: new[i].clone(),
                        });
                    }
                    (None, Some(new_child)) => {
                        changes.push(VDOMChange::AddElement {
                            path: parent_index.clone(),
                            element: UIElement::Native(NativeElement {
                                native_type: NativeElementType::Fragment,
                                props: None,
                                children: Some(vec![new_child.clone()]),
                                key: None,
                                events: None,
                            }),
                        });
                    }
                    (Some(_), None) => {
                        changes.push(VDOMChange::RemoveElement {
                            path: parent_index.clone(),
                        });
                    }
                    _ => {}
                }
                parent_index.pop();
            }
        }
        (None, Some(new)) if !new.is_empty() => {
            changes.push(VDOMChange::UpdateChildren {
                path: parent_index.clone(),
                children: new.clone(),
            });
        }
        (Some(old), None) if !old.is_empty() => {
            changes.push(VDOMChange::RemoveChildren {
                path: parent_index.clone(),
            });
        }
        _ => {}
    }
}
