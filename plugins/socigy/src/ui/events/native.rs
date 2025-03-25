use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NativeLayoutEvent {
    layout: LayoutRectangle,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LayoutRectangle {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NativeTouchEvent {
    /// Array of all touch events that have changed since the last event.
    pub changed_touches: Vec<Box<NativeTouchEvent>>,
    /// The ID of the touch.
    pub identifier: String,
    /// The X position of the touch, relative to the element.
    pub location_x: f64,
    /// The Y position of the touch, relative to the element.
    pub location_y: f64,
    /// The X position of the touch, relative to the screen.
    pub page_x: f64,
    /// The Y position of the touch, relative to the screen.
    pub page_y: f64,
    /// The node ID of the element receiving the touch event.
    pub target: String,
    /// Array of all current touches on the screen.
    pub touches: Vec<Box<NativeTouchEvent>>,
    /// 3D Touch reported force (iOS only).
    pub force: Option<f64>,
}
