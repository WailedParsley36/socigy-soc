use std::{any::Any, cell::RefCell, collections::HashMap, rc::Rc};

use wasm_bindgen::prelude::wasm_bindgen;

use crate::utils::{crypto::random_v4_uuid_str, json::parse_json};

#[derive(Debug)]
pub enum CallbackError {
    General {
        error: String,
        message: String,
        code: i32,
    },
}

pub struct CallbackResult<T> {
    result: Option<T>,
    error: Option<CallbackError>,
}

impl<T> CallbackResult<T> {
    pub fn is_ok(&self) -> bool {
        self.result.is_some()
    }
    pub fn is_error(&self) -> bool {
        self.error.is_some()
    }

    pub fn get_result(&self) -> Option<&T> {
        self.result.as_ref()
    }
    pub fn get_error(&self) -> Option<&CallbackError> {
        self.error.as_ref()
    }

    pub fn expect_result(&self, message: &str) -> &T {
        match (&self.result, &self.error) {
            (Some(result), _) => result,
            (None, Some(error)) => panic!("{}: {:?}", message, error),
            (None, None) => panic!("Neither error or result were present: {}", message),
        }
    }
    pub fn expect_error(&self, message: &str) -> &CallbackError {
        self.error.as_ref().expect(message)
    }
}

thread_local! {
    static REGISTERED_CALLBACKS: RefCell<HashMap<String, Box<dyn Any>>> = RefCell::new(HashMap::new());
}

pub fn register_callback(callback: Box<dyn Any>) -> String {
    let id = random_v4_uuid_str();
    REGISTERED_CALLBACKS.with_borrow_mut(|callbacks| {
        callbacks.insert(id.clone(), callback);
    });

    id
}
pub fn register_callback_with_id(id: String, callback: Box<dyn Any>) {
    REGISTERED_CALLBACKS.with_borrow_mut(|callbacks| {
        callbacks.insert(id, callback);
    });
}

#[wasm_bindgen]
pub fn invoke_rust_callback(id: String, args: String) {
    REGISTERED_CALLBACKS.with_borrow_mut(|callbacks| {
        if let Some(cb) = callbacks.remove(&id) {
            if let Ok(function) = cb.downcast::<Box<dyn FnOnce(String)>>() {
                function(
                    parse_json(&args.as_str())
                        .expect("Wrong JS arguments were passed down to the rust_callback"),
                )
            }
        }
    });
}

#[doc(hidden)]
#[macro_export]
macro_rules! invoke_native_for_user_consumption {
    ($internal_callback:expr, $callback:expr, $expect:literal, $( $arg:expr ),*) => {
        let callback_id = $crate::callbacks::register_callback($crate::callback!(move |result: String| {
            $callback($crate::utils::json::parse_json(result.as_str()).expect($expect))
        }));

        $internal_callback(callback_id, $( $arg ),*)
    };
}

#[macro_export]
macro_rules! callback {
    ($callback:expr) => {
        Box::new($callback)
    };
}
