use std::{
    borrow::Cow,
    collections::{HashMap, HashSet},
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use socigy_macros::{ui_component, UIProps};
use uuid::Uuid;

use crate::logging;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum NativeElementType {
    Fragment,
    View,
    Text,
    Pressable,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    FlatList,
    SafeAreaView,
    FlashList,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(untagged)]
pub enum NativeElementProps {
    View(View),
    Text(Text),
    Image(Image),
    FlatList(FlatList),
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(untagged)]
pub enum PropStr {
    String(Cow<'static, str>),
}
impl PropStr {
    pub fn is_empty(&self) -> bool {
        match self {
            PropStr::String(str) => str.is_empty(),
        }
    }
}
impl From<String> for PropStr {
    fn from(value: String) -> Self {
        PropStr::String(Cow::Owned(value))
    }
}
impl From<&'static str> for PropStr {
    fn from(value: &'static str) -> Self {
        PropStr::String(Cow::Borrowed(value))
    }
}
impl From<UIElementChildren> for PropStr {
    fn from(value: UIElementChildren) -> Self {
        match value {
            UIElementChildren::String(str) => str.into(),
            _ => panic!("Only string values can be converted to PropStr"),
        }
    }
}

#[derive(Clone, Debug)]
#[ui_component]
pub struct View {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<PropStr>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<PropStr>,
}
impl From<View> for NativeElementProps {
    fn from(value: View) -> Self {
        NativeElementProps::View(value)
    }
}
impl From<View> for Option<NativeElementProps> {
    fn from(value: View) -> Self {
        Some(value.into())
    }
}

#[derive(Clone, Debug)]
#[ui_component]
pub struct Image {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<PropStr>,
}
impl From<Image> for NativeElementProps {
    fn from(value: Image) -> Self {
        NativeElementProps::Image(value)
    }
}
impl From<Image> for Option<NativeElementProps> {
    fn from(value: Image) -> Self {
        Some(value.into())
    }
}

#[derive(Clone, Debug)]
#[ui_component]
pub struct Text {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_name: Option<PropStr>,
}
impl From<Text> for NativeElementProps {
    fn from(value: Text) -> Self {
        NativeElementProps::Text(value)
    }
}
impl From<Text> for Option<NativeElementProps> {
    fn from(value: Text) -> Self {
        Some(value.into())
    }
}

#[derive(Clone, Debug)]
#[ui_component]
pub struct FlatList {
    pub class_name: Option<PropStr>,
}
impl From<FlatList> for NativeElementProps {
    fn from(value: FlatList) -> Self {
        NativeElementProps::FlatList(value)
    }
}
impl From<FlatList> for Option<NativeElementProps> {
    fn from(value: FlatList) -> Self {
        Some(value.into())
    }
}

#[derive(Serialize, Deserialize, Clone, PartialEq)]
#[serde(untagged)]
pub enum UIElement {
    Native(NativeElement),
    External(ExternalElement),
}
impl From<NativeElement> for UIElement {
    fn from(value: NativeElement) -> Self {
        UIElement::Native(value)
    }
}
impl From<ExternalElement> for UIElement {
    fn from(value: ExternalElement) -> Self {
        UIElement::External(value)
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ExternalElement {
    pub id: Uuid,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub props: Option<HashMap<String, serde_json::Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(serialize_with = "serialize_children")]
    pub children: Option<Vec<UIElementChildren>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) events: Option<HashMap<String, HashSet<String>>>,

    #[serde(rename = "type", serialize_with = "serialize_external_type")]
    pub(crate) _phantom_type: (),
}

fn serialize_external_type<S>(_: &(), serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    serializer.serialize_str("External")
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NativeElement {
    #[serde(rename = "type")]
    pub native_type: NativeElementType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub props: Option<NativeElementProps>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(serialize_with = "serialize_children")]
    pub children: Option<Vec<UIElementChildren>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) events: Option<HashMap<String, HashSet<String>>>,
}

#[derive(Serialize, Clone, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum UIElementChildren {
    None,
    String(String),
    Element(UIElement),

    #[serde(serialize_with = "serialize_optional_elements")]
    OptionalElements(Vec<Option<UIElement>>),
    #[serde(serialize_with = "serialize_children_elements")]
    Elements(Vec<UIElement>),
}

fn serialize_optional_elements<S>(
    elements: &Vec<Option<UIElement>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: ::serde::Serializer,
{
    use serde::ser::SerializeSeq;

    let mut seq =
        serializer.serialize_seq(Some(elements.iter().filter(|e| e.is_some()).count()))?;

    let mut key_not_found = false;
    let mut key_values = HashSet::<&String>::new();
    for element in elements.iter().flatten() {
        let key_result = enforce_key(element);
        match key_result {
            Some(key) => {
                if !key_values.insert(key) {
                    logging::adv_error(
                        "Conflicting element key has been found. Please assign unique keys",
                        None,
                        false,
                    );
                }
            }
            None => {
                key_not_found = true;
            }
        }

        seq.serialize_element(element)?;
    }

    if key_not_found {
        logging::adv_error("Not all elements in list have key assigned. For better performance please assign unique keys", None, false);
    }

    seq.end()
}

fn serialize_children_elements<S>(
    elements: &Vec<UIElement>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: ::serde::Serializer,
{
    use serde::ser::SerializeSeq;

    let mut seq = serializer.serialize_seq(Some(elements.iter().count()))?;

    let mut key_not_found = false;
    let mut key_values = HashSet::<&String>::new();
    for element in elements.iter() {
        let key_result = enforce_key(element);
        match key_result {
            Some(key) => {
                if !key_values.insert(key) {
                    logging::adv_error(
                        "Conflicting element key has been found. Please assign unique keys",
                        None,
                        false,
                    );
                }
            }
            None => {
                key_not_found = true;
            }
        }

        seq.serialize_element(element)?;
    }

    if key_not_found {
        logging::adv_error("Not all elements in list have key assigned. For better performance please assign unique keys", None, false);
    }

    seq.end()
}

fn enforce_key(child: &UIElement) -> &Option<String> {
    match child {
        UIElement::External(external) => &external.key,
        UIElement::Native(native) => &native.key,
    }
}

fn serialize_children<S>(
    children: &Option<Vec<UIElementChildren>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: ::serde::Serializer,
{
    use serde::ser::SerializeSeq;

    let mut seq = serializer.serialize_seq(Some(children.as_ref().map_or(0, |v| v.len())))?;

    if let Some(children_vec) = children {
        let mut child_iter = children_vec.into_iter().peekable();
        let mut current_str = String::new();

        while let Some(child) = child_iter.next() {
            match child {
                UIElementChildren::OptionalElements(nested) => {
                    let mut key_not_found = false;
                    let mut key_values = HashSet::<&String>::new();
                    for nested_child in nested.iter().flatten() {
                        let key_result = enforce_key(nested_child);
                        match key_result {
                            Some(key) => {
                                if !key_values.insert(key) {
                                    logging::adv_error(format!("Conflicting element key has been found '{}'. Please assign unique keys", key).as_str(), None, false);
                                }
                            }
                            None => {
                                key_not_found = true;
                            }
                        }

                        seq.serialize_element(nested_child)?;
                    }

                    if key_not_found {
                        logging::adv_error("Not all elements in list have key assigned. For better performance please assign unique keys", None, false);
                    }
                }
                UIElementChildren::Elements(nested) => {
                    let mut key_not_found = false;
                    let mut key_values = HashSet::<&String>::new();
                    for nested_child in nested.iter() {
                        let key_result = enforce_key(nested_child);
                        match key_result {
                            Some(key) => {
                                if !key_values.insert(key) {
                                    logging::adv_error("Conflicting element key has been found. Please assign unique keys", None, false);
                                }
                            }
                            None => {
                                key_not_found = true;
                            }
                        }

                        seq.serialize_element(nested_child)?;
                    }

                    if key_not_found {
                        logging::adv_error("Not all elements in list have key assigned. For better performance please assign unique keys", None, false);
                    }
                }
                UIElementChildren::String(str) => match child_iter.peek() {
                    Some(UIElementChildren::String(next_str)) => {
                        current_str.push_str(&str);
                        current_str.push_str(next_str);
                    }
                    _ => {
                        if !current_str.is_empty() {
                            seq.serialize_element(&current_str)?;
                            current_str.clear();
                        } else {
                            seq.serialize_element(&str)?;
                        }
                    }
                },
                _ => {
                    seq.serialize_element(&child)?;
                }
            }
        }
    }

    seq.end()
}

impl Default for ExternalElement {
    fn default() -> Self {
        Self {
            id: Default::default(),
            key: Default::default(),
            props: Default::default(),
            children: Default::default(),
            events: Default::default(),
            _phantom_type: (),
        }
    }
}
impl Default for NativeElement {
    fn default() -> Self {
        Self {
            native_type: NativeElementType::View,
            props: Default::default(),
            children: Default::default(),
            events: Default::default(),
            key: Default::default(),
        }
    }
}

impl PartialEq for ExternalElement {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
            && self.id == other.id
            && self.children.is_some() == other.children.is_some()
            && self.children.as_ref().map(|c| c.len()) == other.children.as_ref().map(|c| c.len())
            && self.props.is_some() == other.props.is_some()
    }
}

impl PartialEq for NativeElement {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key
            && self.native_type == other.native_type
            && self.children.is_some() == other.children.is_some()
            && self.children.as_ref().map(|c| c.len()) == other.children.as_ref().map(|c| c.len())
            && self.props.is_some() == other.props.is_some()
            && self.props.as_ref().map(|_| true) == other.props.as_ref().map(|_| true)
    }
}

impl NativeElement {
    pub fn new(
        native_type: NativeElementType,
        props: Option<NativeElementProps>,
        children: Option<Vec<UIElementChildren>>,
        key: Option<String>,
    ) -> NativeElement {
        NativeElement {
            native_type: native_type,
            props: props,
            children: children,
            events: None,
            key: key,
        }
    }
}
impl ExternalElement {
    pub fn new(
        id: Uuid,
        props: Option<HashMap<String, Value>>,
        children: Option<Vec<UIElementChildren>>,
        key: Option<String>,
    ) -> ExternalElement {
        ExternalElement {
            id: id,
            props: props,
            children: children,
            events: None,
            key: key,
            _phantom_type: (),
        }
    }
}

impl From<UIElement> for UIElementChildren {
    fn from(value: UIElement) -> Self {
        UIElementChildren::Element(value)
    }
}
impl From<Option<UIElement>> for UIElementChildren {
    fn from(value: Option<UIElement>) -> Self {
        match value {
            None => UIElementChildren::None,
            Some(val) => val.into(),
        }
    }
}

impl From<UIElementChildren> for UIElement {
    fn from(value: UIElementChildren) -> Self {
        match value {
            UIElementChildren::Element(e) => e,
            UIElementChildren::String(str) => UIElement::Native(NativeElement {
                native_type: NativeElementType::Text,
                props: None,
                children: vec![UIElementChildren::String(str)].into(),
                key: None,
                events: None,
            }),
            UIElementChildren::Elements(elements) => UIElement::Native(NativeElement {
                native_type: NativeElementType::Fragment,
                props: None,
                children: Some(elements.into_iter().map(|e| e.into()).collect()),
                key: None,
                events: None,
            }),
            UIElementChildren::OptionalElements(elements) => UIElement::Native(NativeElement {
                native_type: NativeElementType::Fragment,
                props: None,
                children: Some(elements.into_iter().map(|e| e.into()).collect()),
                key: None,
                events: None,
            }),
            UIElementChildren::None => UIElement::Native(NativeElement {
                native_type: NativeElementType::Fragment,
                props: None,
                children: None,
                key: None,
                events: None,
            }),
        }
    }
}
impl From<Vec<UIElementChildren>> for UIElementChildren {
    fn from(value: Vec<UIElementChildren>) -> Self {
        UIElementChildren::OptionalElements(value.into_iter().map(|v| v.into()).map(Some).collect())
    }
}
impl From<Option<Vec<UIElementChildren>>> for UIElementChildren {
    fn from(value: Option<Vec<UIElementChildren>>) -> Self {
        match value {
            None => UIElementChildren::None,
            Some(val) => val.into(),
        }
    }
}

impl From<String> for UIElementChildren {
    fn from(value: String) -> Self {
        UIElementChildren::String(value)
    }
}
impl From<Option<String>> for UIElementChildren {
    fn from(value: Option<String>) -> Self {
        match value {
            None => UIElementChildren::None,
            Some(val) => val.into(),
        }
    }
}

impl From<&str> for UIElementChildren {
    fn from(value: &str) -> Self {
        UIElementChildren::String(value.to_string())
    }
}
impl From<Option<&str>> for UIElementChildren {
    fn from(value: Option<&str>) -> Self {
        match value {
            None => UIElementChildren::None,
            Some(val) => val.into(),
        }
    }
}

impl From<PropStr> for UIElementChildren {
    fn from(value: PropStr) -> Self {
        match value {
            PropStr::String(str) => UIElementChildren::String(str.into()),
        }
    }
}
impl From<Option<PropStr>> for UIElementChildren {
    fn from(value: Option<PropStr>) -> Self {
        match value {
            None => UIElementChildren::None,
            Some(val) => val.into(),
        }
    }
}

impl From<Vec<Option<UIElement>>> for UIElementChildren {
    fn from(value: Vec<Option<UIElement>>) -> Self {
        UIElementChildren::OptionalElements(value)
    }
}
impl From<Vec<UIElement>> for UIElementChildren {
    fn from(value: Vec<UIElement>) -> Self {
        UIElementChildren::Elements(value)
    }
}

impl std::fmt::Debug for UIElement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UIElement::Native(n) => f.debug_struct("Native").field("element", n).finish(),
            UIElement::External(e) => f.debug_struct("External").field("element", e).finish(),
        }
    }
}

impl std::fmt::Debug for NativeElement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NativeElement")
            .field("native_type", &self.native_type)
            .field("props", &self.props)
            .field("children", &self.children)
            .field("key", &self.key)
            .finish()
    }
}
impl std::fmt::Debug for ExternalElement {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ExternalElement")
            .field("id", &self.id)
            .field("props", &self.props)
            .field("children", &self.children)
            .finish()
    }
}
impl std::fmt::Debug for UIElementChildren {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UIElementChildren::OptionalElements(list) => f.debug_list().entries(list).finish(),
            UIElementChildren::Elements(list) => f.debug_list().entries(list).finish(),
            UIElementChildren::None => f
                .debug_struct("UIElementChildren")
                .field("Type", &"None".to_string())
                .finish(),
            UIElementChildren::String(s) => f.debug_tuple("String").field(s).finish(),
            UIElementChildren::Element(e) => f.debug_tuple("Element").field(e).finish(),
        }
    }
}

pub mod props {
    use std::{any::Any, collections::HashMap};

    pub fn get_any_map_required_value<T>(map: &HashMap<String, Box<dyn Any>>, name: &str) -> T
    where
        T: Clone + 'static,
    {
        map.get(name)
            .and_then(|v| v.downcast_ref::<T>())
            .expect(format!("The {} prop is required", name).as_str())
            .clone()
    }
    pub fn get_any_map_value<T>(map: &HashMap<String, Box<dyn Any>>, name: &str) -> Option<T>
    where
        T: Clone + 'static,
    {
        match map.get(name).and_then(|v| v.downcast_ref::<T>()) {
            Some(t_val) => Some(t_val.clone()),
            None => None,
        }
    }
}

pub use crate::ui::events::elements::Eventable;

use super::events::elements;
