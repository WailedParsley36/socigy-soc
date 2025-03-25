use std::collections::{HashMap, HashSet};

use crate::{
    ui::elements::{ExternalElement, NativeElement, UIElement, UIElementChildren},
    utils::crypto::random_v4_uuid_str,
};

use super::{bindings::REGISTERED_EVENTS, UIEvent};

pub trait Eventable {
    fn add_event_listener(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> String;
    fn add_event_listener_self(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> Self;

    fn remove_event_listener(&mut self, name: &str);
    fn remove_event_listener_by_id(&mut self, name: &str, id: &str);

    fn invoke_event(&self, name: String, event: &UIEvent);
}

impl Eventable for NativeElement {
    fn remove_event_listener(&mut self, name: &str) {
        let ids = match &mut self.events {
            Some(event) => {
                let local_ids = match event.get(name) {
                    Some(event_ids) => event_ids.clone(),
                    None => return,
                };

                event.remove(name);

                local_ids
            }
            None => return,
        };

        REGISTERED_EVENTS.with(move |events| {
            let mut borrowed = events.borrow_mut();
            for id in ids {
                borrowed.remove(id.as_str());
            }
        });
    }
    fn remove_event_listener_by_id(&mut self, name: &str, id: &str) {
        let id_removed = match &mut self.events {
            Some(event) => match event.get_mut(name) {
                Some(event_ids) => event_ids.remove(id),
                None => return,
            },
            None => return,
        };

        // The id was not registered, so no bother to remove it from the REGISTERED_EVENTS, as the ID should not be there
        if !id_removed {
            return;
        }

        REGISTERED_EVENTS.with(move |events| events.borrow_mut().remove(id));
    }

    fn invoke_event(&self, name: String, event: &UIEvent) {
        let events = match &self.events {
            Some(e) => e,
            None => return,
        };

        let event_ids = match events.get(&name) {
            Some(e) => e,
            None => return,
        };

        REGISTERED_EVENTS.with(|registered_events| {
            let mut borrowed_registry = registered_events.borrow_mut();
            for event_id in event_ids {
                let listener = match borrowed_registry.get_mut(event_id) {
                    Some(l) => l,
                    None => continue,
                };

                listener(event);
            }
        });
    }

    fn add_event_listener(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> String {
        let id = random_v4_uuid_str();

        let events = match &mut self.events {
            Some(e) => e,
            None => self.events.insert(HashMap::new()),
        };

        let event_map = events.entry(name.to_string()).or_insert_with(HashSet::new);

        event_map.insert(id.clone());

        REGISTERED_EVENTS.with(|events| events.borrow_mut().insert(id.clone(), listener));

        id
    }
    fn add_event_listener_self(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> Self {
        self.add_event_listener(name, listener);
        self.to_owned()
    }
}
impl Eventable for ExternalElement {
    fn remove_event_listener(&mut self, name: &str) {
        let ids = match &mut self.events {
            Some(event) => {
                let local_ids = match event.get(name) {
                    Some(event_ids) => event_ids.clone(),
                    None => return,
                };

                event.remove(name);

                local_ids
            }
            None => return,
        };

        REGISTERED_EVENTS.with(move |events| {
            let mut borrowed = events.borrow_mut();
            for id in ids {
                borrowed.remove(id.as_str());
            }
        });
    }
    fn remove_event_listener_by_id(&mut self, name: &str, id: &str) {
        let id_removed = match &mut self.events {
            Some(event) => match event.get_mut(name) {
                Some(event_ids) => event_ids.remove(id),
                None => return,
            },
            None => return,
        };

        // The id was not registered, so no bother to remove it from the REGISTERED_EVENTS, as the ID should not be there
        if !id_removed {
            return;
        }

        REGISTERED_EVENTS.with(move |events| events.borrow_mut().remove(id));
    }

    fn invoke_event(&self, name: String, event: &UIEvent) {
        let events = match &self.events {
            Some(e) => e,
            None => return,
        };

        let event_ids = match events.get(&name) {
            Some(e) => e,
            None => return,
        };

        REGISTERED_EVENTS.with(|registered_events| {
            let mut borrowed_registry = registered_events.borrow_mut();
            for event_id in event_ids {
                let listener = match borrowed_registry.get_mut(event_id) {
                    Some(l) => l,
                    None => continue,
                };

                listener(event);
            }
        });
    }

    fn add_event_listener(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> String {
        let id = random_v4_uuid_str();

        let events = match &mut self.events {
            Some(e) => e,
            None => self.events.insert(HashMap::new()),
        };

        let event_map = events.entry(name.to_string()).or_insert_with(HashSet::new);
        event_map.insert(id.clone());

        REGISTERED_EVENTS.with(|events| events.borrow_mut().insert(id.clone(), listener));

        id
    }
    fn add_event_listener_self(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> Self {
        self.add_event_listener(name, listener);
        self.to_owned()
    }
}

impl Eventable for UIElement {
    fn remove_event_listener(&mut self, name: &str) {
        match self {
            UIElement::Native(n) => n.remove_event_listener(name),
            UIElement::External(e) => e.remove_event_listener(name),
        };
    }

    fn remove_event_listener_by_id(&mut self, name: &str, id: &str) {
        match self {
            UIElement::Native(n) => n.remove_event_listener_by_id(name, id),
            UIElement::External(e) => e.remove_event_listener_by_id(name, id),
        };
    }

    fn invoke_event(&self, name: String, event: &UIEvent) {
        match self {
            UIElement::Native(n) => n.invoke_event(name, event),
            UIElement::External(e) => e.invoke_event(name, event),
        };
    }

    fn add_event_listener(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> String {
        match self {
            UIElement::Native(n) => n.add_event_listener(name, listener).into(),
            UIElement::External(e) => e.add_event_listener(name, listener).into(),
        }
    }
    fn add_event_listener_self(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> Self {
        match self {
            UIElement::Native(n) => n.add_event_listener_self(name, listener).into(),
            UIElement::External(e) => e.add_event_listener_self(name, listener).into(),
        }
    }
}
impl Eventable for UIElementChildren {
    fn remove_event_listener(&mut self, name: &str) {
        match self {
            UIElementChildren::Element(e) => e.remove_event_listener(name),
            _ => return,
        };
    }
    fn remove_event_listener_by_id(&mut self, name: &str, id: &str) {
        match self {
            UIElementChildren::Element(e) => e.remove_event_listener_by_id(name, id),
            _ => return,
        };
    }

    fn invoke_event(&self, name: String, event: &UIEvent) {
        match self {
            UIElementChildren::Element(e) => e.invoke_event(name, event),
            _ => return,
        };
    }

    fn add_event_listener_self(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> Self {
        match self {
            UIElementChildren::Element(e) => e.add_event_listener_self(name, listener).into(),
            _ => self.to_owned(),
        }
    }
    fn add_event_listener(&mut self, name: &str, listener: Box<dyn FnMut(&UIEvent)>) -> String {
        match self {
            UIElementChildren::Element(e) => e.add_event_listener(name, listener).into(),
            _ => String::default(),
        }
    }
}
