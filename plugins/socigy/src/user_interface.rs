use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

use crate::logging::log;

// UI Element types that correspond to React Native components
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", content = "props")]
pub enum UIElement {
    View(ViewProps),
    Text(TextProps),
    Button(ButtonProps),
    // Add more elements as needed
}

// Props for different component types
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ViewProps {
    pub style: Option<Style>,
    pub children: Vec<UIElement>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TextProps {
    pub content: String,
    pub style: Option<Style>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ButtonProps {
    pub title: String,
    pub on_press: Option<String>, // Event identifier
    pub style: Option<Style>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Style {
    pub background_color: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    // Add more style properties as needed
}

// Event system for handling React Native interactions
#[derive(Clone)]
pub struct EventBus {
    listeners: Rc<RefCell<Vec<(String, Box<dyn Fn() + 'static>)>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self {
            listeners: Rc::new(RefCell::new(Vec::new())),
        }
    }

    pub fn subscribe<F>(&self, event_id: &str, callback: F)
    where
        F: Fn() + 'static,
    {
        self.listeners
            .borrow_mut()
            .push((event_id.to_string(), Box::new(callback)));
    }

    pub fn trigger(&self, event_id: &str) {
        let listeners = self.listeners.borrow();
        log(
            crate::logging::LogLevel::Info,
            format!("Listeners: {}", listeners.len()).as_str(),
        );
        for (id, callback) in listeners.iter() {
            log(
                crate::logging::LogLevel::Info,
                format!("Listener: {}", id).as_str(),
            );
            if id == event_id {
                log(
                    crate::logging::LogLevel::Info,
                    format!("Calling the event callback").as_str(),
                );
                callback();
            }
        }
    }
}

// Component trait for React Native components
pub trait Component {
    fn render(&self) -> UIElement;
    fn update(&mut self);
}

// Example component implementation
pub struct CustomButton {
    props: ButtonProps,
    event_bus: EventBus,
}

impl CustomButton {
    pub fn new(title: &str, event_bus: EventBus) -> Self {
        let event_id = format!("button_{}", title.to_lowercase().replace(" ", "_"));

        Self {
            props: ButtonProps {
                title: title.to_string(),
                on_press: Some(event_id),
                style: Some(Style {
                    background_color: Some("blue".to_string()),
                    width: Some(200),
                    height: Some(40),
                }),
            },
            event_bus,
        }
    }
}

impl Component for CustomButton {
    fn render(&self) -> UIElement {
        UIElement::Button(self.props.clone())
    }

    fn update(&mut self) {
        log(crate::logging::LogLevel::Info, "WOWOWOWO");
        self.props.title = String::from("Hey, you clicked me");
    }
}

// Bridge between Rust and React Native
#[wasm_bindgen]
pub struct RustUIBridge {
    event_bus: EventBus,
    root_component: Option<Box<dyn Component>>,
}

#[wasm_bindgen]
impl RustUIBridge {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            event_bus: EventBus::new(),
            root_component: None,
        }
    }

    // Internal method to set the root component
    fn set_root_component(&mut self, component: Box<dyn Component>) {
        self.root_component = Some(component);
    }

    // Public API for JavaScript to initialize the UI
    #[wasm_bindgen]
    pub fn initialize_default_ui(&mut self) {
        let button = CustomButton::new("Click Me", self.event_bus.clone());
        self.set_root_component(Box::new(button));
    }

    // Get the UI tree as a JSON string that React Native can parse
    #[wasm_bindgen]
    pub fn get_ui_tree(&self) -> String {
        if let Some(component) = &self.root_component {
            serde_json::to_string(&component.render()).unwrap_or_else(|_| "null".to_string())
        } else {
            "null".to_string()
        }
    }

    // Handle events from React Native
    #[wasm_bindgen]
    pub fn handle_event(&self, event_id: &str) {
        log(crate::logging::LogLevel::Info, "Started event trigger");
        self.event_bus.trigger(event_id);
    }
}

// Example usage
#[wasm_bindgen]
pub fn create_example_app() -> RustUIBridge {
    let mut bridge = RustUIBridge::new();
    let button = CustomButton::new("Click Me", bridge.event_bus.clone());

    bridge.event_bus.subscribe("button_click_me", || {
        // Handle button click
        wasm_bindgen_futures::spawn_local(async {
            // Your async logic here
        });
    });

    bridge.set_root_component(Box::new(button));
    bridge
}
