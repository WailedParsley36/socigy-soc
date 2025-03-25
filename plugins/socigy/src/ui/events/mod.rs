use std::collections::HashMap;

use native::{NativeLayoutEvent, NativeTouchEvent};
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub mod bindings;
pub mod elements;
pub mod native;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UIEvent {
    #[serde(flatten)]
    pub event_type: EventType,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum EventType {
    OnCustom(HashMap<String, Value>),
    OnLayout(NativeLayoutEvent),

    OnTouchStart(NativeTouchEvent),
    OnTouchEnd(NativeTouchEvent),
    OnTouchMove(NativeTouchEvent),
    OnTouchEndCapture(NativeTouchEvent),
    OnTouchCancel(NativeTouchEvent),

    OnLongPress(NativeTouchEvent),
    OnPress(NativeTouchEvent),
    OnPressIn(NativeTouchEvent),
    OnPressOut(NativeTouchEvent),
}
