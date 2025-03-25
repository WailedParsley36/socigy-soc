#[macro_export]
macro_rules! date_now {
    () => {
        js_sys::Date::new(&wasm_bindgen::JsValue::from(js_sys::Date::now()))
    };
}

#[macro_export]
macro_rules! date_now_format_time {
    () => {
        crate::format_date_time!(js_sys::Date::new(&wasm_bindgen::JsValue::from(
            js_sys::Date::now()
        )))
    };
}

#[macro_export]
macro_rules! format_date_time {
    ($date:expr) => {
        format!(
            "{:02}:{:02}:{:02}:{:03}",
            $date.get_hours(),
            $date.get_minutes(),
            $date.get_seconds(),
            $date.get_milliseconds()
        )
    };
}
