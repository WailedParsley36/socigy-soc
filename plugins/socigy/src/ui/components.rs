use super::{elements::UIElement, events::UIEvent};
use crate::{error, logging, warn};

use serde::de::DeserializeOwned;
use std::any::Any;

pub trait AnyComponent: Any {
    fn render(&mut self, props: Option<String>) -> Option<UIElement>;

    fn mount(&mut self);
    fn unmount(&mut self);
}

pub trait UIComponent: DeserializeOwned {
    fn render(&mut self) -> Option<UIElement>;

    fn mount(&mut self);
    fn unmount(&mut self);
}

#[derive(Default)]
pub(crate) struct ComponentInstance<T>
where
    T: UIComponent + 'static,
{
    pub component_cache: Option<T>,
    pub last_props: Option<String>,
}

impl<T> ComponentInstance<T>
where
    T: UIComponent,
{
    fn update_component(&mut self, props: Option<String>) {
        // Props are the same no need to change
        if props == self.last_props && self.component_cache.is_some() {
            return;
        }

        self.last_props = props.clone();

        match props {
            Some(prps) => {
                self.component_cache = match serde_json::from_str::<T>(prps.as_str()) {
                    Ok(res) => Some(res),
                    Err(e) => {
                        error!("Invalid props were passed to the component: {:?}", e);

                        None
                    }
                };
            }
            None => {
                // The component could be propless
                self.component_cache = match serde_json::from_str::<T>("{}") {
                    Ok(res) => Some(res),
                    Err(e) => {
                        logging::adv_fatal(
                            format!("Invalid props were passed to the component: {:?}", e).as_str(),
                            None,
                        );

                        None
                    }
                };
            }
        }
    }
}

impl<T> AnyComponent for ComponentInstance<T>
where
    T: UIComponent,
{
    fn render(&mut self, props: Option<String>) -> Option<UIElement> {
        self.update_component(props);

        match self.component_cache.as_mut() {
            Some(comp) => comp.render(),
            None => None,
        }
    }

    fn mount(&mut self) {
        match self.component_cache.as_mut() {
            Some(comp) => {
                comp.mount();
            }
            None => {
                warn!("Mounting dead component");
            }
        }
    }

    fn unmount(&mut self) {
        match self.component_cache.as_mut() {
            Some(comp) => {
                comp.mount();
            }
            None => {
                warn!("Unmounting dead component");
            }
        }
    }
}
