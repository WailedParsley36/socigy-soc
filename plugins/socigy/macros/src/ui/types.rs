use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
    str::FromStr,
};

use proc_macro::{Group, Literal};
use proc_macro2::{Ident, Span};
use proc_macro_error::abort;
use quote::{format_ident, quote, IdentFragment, ToTokens, TokenStreamExt};
use uuid::Uuid;

thread_local! {
    static SOCIGY_ELEMENTS: RefCell<HashSet<&'static str>> = RefCell::new(HashSet::from(["View","Text","FlatList","FlashList","TouchableOpacity"]));
}

#[derive(Debug, Clone)]
pub enum JsxChild {
    String(String),
    Element(JsxElement),
    Variable(Ident),
    Functional(proc_macro2::TokenStream),
}
impl ToTokens for JsxChild {
    fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
        match self {
            JsxChild::Variable(var) => {
                tokens.append_all(quote! {
                    ::socigy::ui::elements::UIElementChildren::from(#var)
                });
            }
            JsxChild::Functional(stream) => {
                tokens.append_all(quote! {
                    ::socigy::ui::elements::UIElementChildren::from(#stream)
                });
            }
            JsxChild::String(str) => {
                tokens.append_all(
                    quote! { ::socigy::ui::elements::UIElementChildren::String(#str.into()) },
                );
            }
            JsxChild::Element(el) => {
                if let Some(tag) = &el.tag {
                    // Check if tag is "External" or exists in the SOCIGY_ELEMENTS set
                    if tag == "External" || SOCIGY_ELEMENTS.with_borrow(|set| set.contains(tag.as_str())) {
                        tokens.append_all(quote! { ::socigy::ui::elements::UIElementChildren::Element(#el) });
                    } else {
                        tokens.append_all(quote! { #el });
                    }
                } else {
                    // If no tag is set, treat it as an element
                    tokens.append_all(quote! { ::socigy::ui::elements::UIElementChildren::Element(#el) });
                }
            }
        }
    }
}

#[derive(Debug, Clone)]
pub enum JsxAttributeValue {
    Literal(Literal),
    Ident(Ident),
    Group(Group),

    Variable(String),
    Event(Group),
}
fn group_to_tokens(group: &Group, tokens: &mut proc_macro2::TokenStream) {
    let group_stream: proc_macro2::TokenStream = group.stream().into();

    match group.delimiter() {
        proc_macro::Delimiter::Parenthesis => {
            tokens.append_all(quote! {
                (#group_stream)
            });
        }
        proc_macro::Delimiter::Bracket => {
            tokens.append_all(quote! {
                [#group_stream]
            });
        }
        _ => {
            tokens.append_all(quote! {
                #group_stream
            });
        }
    }
}
impl Default for JsxAttributeValue {
    fn default() -> Self {
        JsxAttributeValue::Variable(String::new())
    }
}
impl ToTokens for JsxAttributeValue {
    fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
        match self {
            JsxAttributeValue::Ident(ident) => {
                tokens.append_all(quote! {
                    #ident
                });
            }
            // Events are handled in the upper level and thus should not be called with the other attributes
            JsxAttributeValue::Event(group) => {
                let stream: proc_macro2::TokenStream = group.stream().into();

                tokens.append_all(quote! {
                    #stream
                });
            }
            JsxAttributeValue::Literal(literal) => {
                let lit_str = literal.to_string();
                let lit_c_str: &str = lit_str.trim_matches('\'').trim_matches('"');

                if lit_str.starts_with('"') && lit_str.ends_with('"') {}

                tokens.append_all(quote! {
                    #lit_c_str
                });
            }
            JsxAttributeValue::Variable(var) => {
                let ident = proc_macro2::Ident::new(var, Span::call_site());

                tokens.append_all(quote! {
                    #ident
                });
            }
            JsxAttributeValue::Group(group) => {
                group_to_tokens(&group, tokens);
            }
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct JsxAttribute {
    pub name: String,
    pub value: JsxAttributeValue,

    pub span: Option<Span>,
}
fn to_camel_case(input: &str) -> String {
    let mut result = String::new();
    let mut capitalize_next = false;

    for (i, c) in input.chars().enumerate() {
        if c == '_' || c == '-' {
            capitalize_next = true;
            continue;
        }
        if capitalize_next {
            result.push(c.to_ascii_uppercase());
            capitalize_next = false;
        } else {
            // For the first character, or after any non-alphanumeric, use lowercase
            if i == 0 {
                result.push(c.to_ascii_lowercase());
            } else {
                result.push(c);
            }
        }
    }

    result
}
impl ToTokens for JsxAttribute {
    fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
        let name_ident =
            proc_macro2::Ident::new(&self.name, self.span.unwrap_or(Span::call_site()));

        let value = &self.value;
        match value {
            // Events are handled in the upper level and thus should not be called with the other attributes
            JsxAttributeValue::Event(_) => {
                tokens.append_all(quote! {
                    #value
                });
            }
            _ => tokens.append_all(quote! {
                #name_ident(#value.into())
            }),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct JsxElement {
    pub tag: Option<String>,
    pub attributes: Option<HashMap<String, JsxAttribute>>,
    pub children: Option<Vec<JsxChild>>,

    pub span: Option<Span>,
}
impl JsxElement {
    fn output_id_prop(
        &self,
        attributes: &HashMap<String, JsxAttribute>,
    ) -> proc_macro2::TokenStream {
        match attributes.get("id") {
            Some(id) => match &id.value {
                JsxAttributeValue::Variable(var) => {
                    let id_ident = proc_macro2::Ident::new(
                        var,
                        id.span.unwrap_or(self.span.unwrap_or(Span::call_site())),
                    );

                    quote! {
                        #id_ident
                    }
                }
                JsxAttributeValue::Literal(val) => {
                    let val_str = val.to_string();
                    let val_c_str = val_str.trim_matches('"');

                    match Uuid::from_str(val_c_str) {
                        Ok(_) => {}
                        Err(_) => {
                            abort!(
                                id.span.unwrap_or(self.span.unwrap_or(Span::call_site())),
                                "External elements must have 'id' attribute with a valid UUID"
                            );
                        }
                    };

                    quote! {
                        ::socigy::uuid::uuid!(#val_c_str)
                    }
                }
                _ => {
                    abort!(
                        id.span.unwrap_or(self.span.unwrap_or(Span::call_site())),
                        "External elements must have 'id' attribute with a valid UUID"
                    );
                }
            },
            None => {
                abort!(
                    self.span.unwrap_or(Span::call_site()),
                    "External elements must have 'id' attribute"
                );
            }
        }
    }

    fn output_key_prop(
        &self,
        attributes: &HashMap<String, JsxAttribute>,
    ) -> proc_macro2::TokenStream {
        match attributes.get("key") {
            Some(attribute) => match &attribute.value {
                JsxAttributeValue::Variable(var) => {
                    let var_ident = proc_macro2::Ident::new(
                        var.as_str(),
                        attribute
                            .span
                            .unwrap_or(self.span.unwrap_or(Span::call_site())),
                    );

                    quote! {
                        #var_ident.into()
                    }
                }
                JsxAttributeValue::Literal(lit) => {
                    let lit_str = lit.to_string();
                    if !lit_str.starts_with('"') {
                        abort!(
                            attribute
                                .span
                                .unwrap_or(self.span.unwrap_or(Span::call_site())),
                            "'key' is a reserved prop that must be a String {:?}"
                        );
                    }

                    let lit_c_str = lit_str.trim_matches('"');

                    quote! {
                        Some(#lit_c_str.into())
                    }
                }
                JsxAttributeValue::Group(group) => {
                    let group_2: proc_macro2::TokenStream = group.stream().into();

                    quote! {
                        Some(#group_2)
                    }
                }
                _ => {
                    abort!(
                        attribute
                            .span
                            .unwrap_or(self.span.unwrap_or(Span::call_site())),
                        format!(
                            "'key' is a reserved prop that must be a String. {:?}",
                            attribute
                        )
                        .as_str()
                    );
                }
            },
            None => quote! { None },
        }
    }
}
impl ToTokens for JsxElement {
    fn to_tokens(&self, tokens: &mut proc_macro2::TokenStream) {
        let mut children_empty = true;
        let children = self.children.as_ref().map_or_else(
            || quote! { None },
            |children| {
                children_empty = children.is_empty();
                if children_empty {
                    quote! { None }
                } else {
                    quote! { Some(vec![#(#children),*]) }
                }
            },
        );

        if let Some(tag) = &self.tag {
            // Normal Element
            let tag_str = tag.as_str();
            let tag_ident =
                proc_macro2::Ident::new(tag, tag.span().unwrap_or(proc_macro2::Span::call_site()));

            // Native element
            if SOCIGY_ELEMENTS.with_borrow(|elements| elements.contains(tag_str)) {
                let key_attribute = match &self.attributes {
                    Some(attr) => self.output_key_prop(attr),
                    None => quote! {None},
                };
                let mut events: proc_macro2::TokenStream = proc_macro2::TokenStream::new();
                let props = match &self.attributes {
                    Some(attr) => {
                        let mut attributes = vec![];
                        for (key, value) in attr.iter() {
                            if key == "key" {
                                continue;
                            }

                            if key.starts_with("on_") {
                                let name = to_camel_case(key);
                                let attr_value = &value.value;
                                events.append_all(quote! {
                                    .add_event_listener_self(#name, Box::new(#attr_value))
                                });
                            } else {
                                attributes.push(value);
                            }
                        }
                        
                        let builder_ident = format_ident!("{}Builder", tag_ident);
                        if attributes.len() > 0 {
                            quote! {
                                ::socigy::ui::elements::#builder_ident::default().#(#attributes).*.build().into()
                            }
                        } else {
                            quote! {
                                None
                            }
                        }
                    }
                    None => {
                        quote! {
                            None
                        }
                    }
                };


                if events.is_empty() {
                    tokens.append_all(quote! {
                        ::socigy::ui::elements::UIElement::Native(::socigy::ui::elements::NativeElement::new(
                            ::socigy::ui::elements::NativeElementType::#tag_ident, // Type
                            #props, // Props
                            #children, // Children
                            #key_attribute // Key
                        )#events)
                    })
                } else {
                    tokens.append_all(quote! {
                        {
                            use socigy::ui::events::elements::Eventable;
                            
                            ::socigy::ui::elements::UIElement::Native(::socigy::ui::elements::NativeElement::new(
                                ::socigy::ui::elements::NativeElementType::#tag_ident, // Type
                                #props, // Props
                                #children, // Children
                                #key_attribute // Key
                            )#events)
                        }
                    })
                }

                return;
            }

            match tag_str {
                "External" => {
                    let mut events: proc_macro2::TokenStream = proc_macro2::TokenStream::new();
                    let attributes = match &self.attributes {
                        Some(attr) if attr.is_empty() => {
                            abort!(
                                self.span.unwrap_or(Span::call_site()),
                                "External elements must have 'id' attribute"
                            );
                        }
                        Some(attributes) => attributes,
                        None => {
                            abort!(
                                self.span.unwrap_or(Span::call_site()),
                                "External elements must have 'id' attribute"
                            );
                        }
                    };

                    let id_attribute = self.output_id_prop(attributes);
                    let key_attribute = self.output_key_prop(attributes);

                    tokens.append_all(quote! {
                        ::socigy::ui::elements::UIElement::External(::socigy::ui::elements::ExternalElement::new(
                            #id_attribute,
                            None,
                            #children,
                            #key_attribute
                        ))
                    });
                    return;
                }
                // Could be package defined component
                _ => {
                    let builder_ident = format_ident!("{}Builder", tag_ident);
                    eprintln!("Package Element {}, has_children {}", builder_ident.to_string(), children_empty);
                    let props = match &self.attributes {
                        Some(attr) => {
                            let attributes: Vec<&JsxAttribute> =
                                attr.into_iter().map(|(_, v)| v).collect();

                            if children_empty {
                                quote! {
                                    #builder_ident::default().#(#attributes).*.build()
                                }
                            } else {
                                quote! {
                                    
                                    #builder_ident::default().children(#children.unwrap()).#(#attributes).*.build()
                                }
                            }
                        }
                        None => {
                            if children_empty {
                                quote! {
                                    #builder_ident::default().build()
                                }
                            } else {
                                quote! {
                                    #builder_ident::default().children(#children.unwrap()).build()
                                }
                            }
                        }
                    };

                    tokens.append_all(quote! {
                        #props.render().into()
                    });
                    return;
                }
            }
        } else {
            // Fragment
            tokens.append_all(quote! {
                ::socigy::ui::elements::UIElement::Native(::socigy::ui::elements::NativeElement::new(
                    ::socigy::ui::elements::NativeElementType::Fragment, // Type
                    None, // Props
                    #children, // Children
                    None // Key
                ))
            })
        }
    }
}
