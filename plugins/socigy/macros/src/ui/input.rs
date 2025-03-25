use std::{collections::HashMap, iter::Peekable};

use proc_macro::{token_stream::IntoIter, Ident, Literal, TokenStream, TokenTree};
use proc_macro_error::abort;
use quote::quote;
use regex::Regex;
use utils::merge_idents;

use crate::ui::{errors::ParseError, types::JsxChild};

use super::types::{JsxAttribute, JsxAttributeValue, JsxElement};

mod utils {
    use proc_macro::{token_stream::IntoIter, TokenTree};
    use std::iter::Peekable;

    fn is_next_ident(iter: &mut Peekable<IntoIter>) -> bool {
        match iter.peek() {
            Some(TokenTree::Ident(_)) => true,
            _ => false,
        }
    }
    pub fn merge_idents(iter: &mut Peekable<IntoIter>) -> Option<String> {
        if !is_next_ident(iter) {
            return None;
        }

        let mut result = String::default();
        while let Some(TokenTree::Ident(ident)) = iter.next() {
            result.push_str(&format!(" {}", ident.to_string()));

            if !is_next_ident(iter) {
                break;
            }
        }

        Some(result)
    }
}

fn is_number(s: &str) -> bool {
    let re = Regex::new(r"^\s*-?\d+(\.\d+)?([eE][+-]?\d+)?\s*$").unwrap();
    re.is_match(s)
}

fn parse_jsx_element_attribute_group(
    group: &proc_macro::Group,
    iter: &mut Peekable<IntoIter>,
) -> Result<JsxAttributeValue, ParseError> {
    while let Some(token) = iter.next() {
        match token {
            TokenTree::Ident(ident) => {
                let ident_str = ident.to_string();
                let ident_raw_str = ident_str.as_str();

                // Boolean value
                if ident_str == "false" || ident_str == "true" {
                    return Ok(JsxAttributeValue::Ident(proc_macro2::Ident::new(
                        ident_raw_str,
                        ident.span().into(),
                    )));
                }

                if is_number(ident_raw_str) {
                    return Ok(JsxAttributeValue::Ident(proc_macro2::Ident::new(
                        ident_raw_str,
                        ident.span().into(),
                    )));
                }

                match iter.peek() {
                    Some(TokenTree::Punct(punct)) if punct.as_char() == '|' => {
                        // This is an event
                        return Ok(JsxAttributeValue::Event(group.clone()));
                    }
                    None => {
                        // Only one Ident is there so this is a variable name
                        return Ok(JsxAttributeValue::Variable(ident.to_string()));
                    }
                    _ => {
                        return Ok(JsxAttributeValue::Group(group.clone()));
                    }
                }
            }
            TokenTree::Group(local_group) => return Ok(JsxAttributeValue::Group(local_group)),
            TokenTree::Punct(_) => {
                if iter.peek().is_none() {
                    return Ok(JsxAttributeValue::Group(group.clone()));
                }
            }
            TokenTree::Literal(literal) => {
                // Only one Ident is there so this is a variable name
                if iter.peek().is_none() {
                    return Ok(JsxAttributeValue::Literal(literal));
                }
            }
        }
    }

    Err(ParseError::new(
        "Failed to parse the attribute value",
        Some(group.span()),
    ))
}

fn parse_jsx_element_attribute(
    iter: &mut Peekable<IntoIter>,
    name: Option<&Ident>,
) -> Result<JsxAttribute, ParseError> {
    let mut current_attribute = JsxAttribute::default();

    // Attribute name
    if let Some(name_ident) = name {
        current_attribute.name = name_ident.to_string();
        current_attribute.span = Some(name_ident.span().into());
    } else {
        match iter.next() {
            Some(TokenTree::Ident(name)) => {
                current_attribute.name = name.to_string();
                current_attribute.span = Some(name.span().into());
            }
            Some(token) => {
                return Err(ParseError::new(
                    "Expected attribute name",
                    Some(token.span()),
                ))
            }
            _ => return Err(ParseError::new("Expected attribute name", None)),
        }
    }

    // = sign after name
    match iter.next() {
        Some(TokenTree::Punct(punct)) if punct.as_char() == '=' => {}
        Some(token) => {
            return Err(ParseError::new(
                "Expected '=' after attribute name",
                Some(token.span()),
            ))
        }
        _ => return Err(ParseError::new("Expected '=' after attribute name", None)),
    }

    // Attribute value
    match iter.next() {
        Some(TokenTree::Literal(lit)) => {
            current_attribute.span = Some(
                current_attribute
                    .span
                    .expect("The span should be set from the attribute name")
                    .join(lit.span().into())
                    .unwrap_or(current_attribute.span.unwrap()),
            );

            current_attribute.value = JsxAttributeValue::Literal(lit);
        }
        Some(TokenTree::Group(group)) => {
            let mut stream = group.stream().into_iter().peekable();

            current_attribute.value = parse_jsx_element_attribute_group(&group, &mut stream)?;
            current_attribute.span = Some(
                current_attribute
                    .span
                    .expect("The span should be set from the attribute name")
                    .join(group.span().into())
                    .unwrap_or(current_attribute.span.unwrap()),
            );
        }
        Some(TokenTree::Ident(ident)) => {
            current_attribute.value = JsxAttributeValue::Ident(proc_macro2::Ident::new(ident.to_string().as_str(), ident.span().into()));
            current_attribute.span = Some(
                current_attribute
                    .span
                    .expect("The span should be set from the attribute name")
                    .join(ident.span().into())
                    .unwrap_or(current_attribute.span.unwrap()),
            );
        }
        Some(token) => {
            return Err(ParseError::new(
                format!("Attribute value is invalid. Only String/Number/Boolean are allowed as literals. {:?}", token).as_str(),
                Some(token.span()),
            ))
        }
        _ => {
            return Err(ParseError::new(
                "Attribute value is invalid. Only String/Number/Boolean are allowed as literals",
                None,
            ))
        }
    }

    Ok(current_attribute)
}

fn merge_children_string(children: &mut Vec<JsxChild>, input_str: String, spaces: bool) {
    let children_len = children.len();
    match children.last() {
        Some(JsxChild::String(str)) => {
            let mut new_str = str.clone();
            if spaces {
                new_str.push_str(" ");
            }
            new_str.push_str(&input_str.trim_matches('"').trim_matches('\''));

            children[children_len - 1] = JsxChild::String(new_str);
        }
        _ => {
            children.push(JsxChild::String(
                input_str.trim_matches('"').trim_matches('\'').to_string(),
            ));
        }
    }
}

fn parse_jsx_element(
    iter: &mut Peekable<IntoIter>,
    open_tag_missing: bool,
) -> Result<JsxElement, ParseError> {
    let mut current_element = JsxElement::default();

    // Opening Tag
    if !open_tag_missing {
        match iter.next() {
            Some(TokenTree::Punct(punct)) if punct.as_char() == '<' => {}
            Some(token) => {
                return Err(ParseError::new(
                    "Expected '<' as a start of an element",
                    Some(token.span()),
                ));
            }
            _ => {
                return Err(ParseError::new(
                    "Expected '<' as a start of an element",
                    None,
                ));
            }
        }
    }

    // Element Name / Closing Tag
    match iter.next() {
        // Normal Element
        Some(TokenTree::Ident(next)) => {
            current_element.tag = Some(next.to_string());
            current_element.span = Some(next.span().into());

            // Attributes
            let mut attributes: HashMap<String, JsxAttribute> = HashMap::new();
            while let Some(token) = iter.next() {
                match token {
                    TokenTree::Punct(punct) if punct.as_char() == '>' || punct.as_char() == '/' => {
                        match iter.peek() {
                            // Self-Closing element
                            Some(TokenTree::Punct(next_punct))
                                if punct.as_char() == '/' && next_punct.as_char() == '>' =>
                            {
                                if attributes.len() > 0 {
                                    current_element.attributes = Some(attributes);
                                }

                                if punct.as_char() == '/' {
                                    iter.next();
                                }

                                return Ok(current_element);
                            }
                            // Still break if closing tags found
                            _ => {
                                break;
                            }
                        };
                    }
                    TokenTree::Ident(ident) => {
                        let ident_string = ident.to_string(); // Convert the identifier to a string before insertion
                        if attributes
                            .insert(
                                ident_string.clone(),
                                parse_jsx_element_attribute(iter, Some(&ident))?,
                            )
                            .is_some()
                        {
                            abort!(
                                ident.span(),
                                "Multiple attributes with the same name detected"
                            )
                        }
                    }
                    _ => {
                        return Err(ParseError::new(
                            "Invalid character was found",
                            Some(token.span()),
                        ))
                    }
                }
            }

            if attributes.len() > 0 {
                current_element.attributes = Some(attributes);
            }
        }

        // Fragment
        Some(TokenTree::Punct(next)) if next.as_char() == '>' => {
            current_element.span = Some(next.span().into());
        }
        Some(token) => {
            return Err(ParseError::new(
                "Expected '>' or 'Tag' after start of an element",
                Some(token.span()),
            ))
        }
        _ => {
            return Err(ParseError::new(
                "Expected '>' or 'Tag' after start of an element",
                None,
            ))
        }
    };

    // Children
    let mut children: Vec<JsxChild> = vec![];
    while let Some(token) = &iter.next() {
        match token {
            TokenTree::Punct(punct) if punct.as_char() == '<' => {
                match iter.peek() {
                    // The closing element was found
                    Some(TokenTree::Punct(next_punct)) if next_punct.as_char() == '/' => {
                        iter.next();

                        match iter.peek() {
                            // Escaping the / char
                            Some(TokenTree::Punct(punc)) if punc.as_char() == '/' => {}

                            // No escaping, this is a closing element
                            _ => {
                                break;
                            }
                        };
                    }

                    // Normal element
                    Some(TokenTree::Ident(_)) => {
                        let child = parse_jsx_element(iter, true)?;
                        children.push(JsxChild::Element(child));
                    }
                    // If no escape sequence go and serialize the jsx_element
                    _ => {
                        return Err(ParseError::new(
                            "Unknown element children provided",
                            Some(token.span()),
                        ));
                    }
                };
            }
            TokenTree::Punct(punct) => {
                merge_children_string(&mut children, punct.as_char().into(), false);
            }
            // String children
            TokenTree::Literal(literal) => {
                let lit_str = literal.to_string();

                merge_children_string(&mut children, lit_str, true);
            }
            // String children
            TokenTree::Ident(ident) => {
                let mut ident_str = ident.to_string();

                match merge_idents(iter) {
                    Some(result) => {
                        ident_str.push_str(&result);
                    }
                    _ => {}
                }

                merge_children_string(&mut children, ident_str, true);
            }
            TokenTree::Group(group) => {
                let mut group_iter = group.stream().into_iter().peekable();

                let mut add_functional = true;
                while let Some(token) = group_iter.next() {
                    match token {
                        // Variable name presumably
                        TokenTree::Ident(ident) => {
                            if group_iter.peek().is_none() {
                                add_functional = false;
                                children.push(JsxChild::Variable(proc_macro2::Ident::new(
                                    ident.to_string().as_str(),
                                    ident.span().into(),
                                )));
                            }
                            break;
                        }
                        _ => {
                            break;
                        }
                    }
                }

                if add_functional {
                    children.push(JsxChild::Functional(group.stream().into()));
                }
            }
        }
    }

    if children.len() > 0 {
        current_element.children = Some(children);
    }

    let mut end_found = false;
    match iter.next() {
        // Fragment element
        Some(TokenTree::Punct(punct)) if punct.as_char() == '>' => {
            end_found = true;
            current_element.span = Some(
                current_element
                    .span
                    .expect("The span should be filled from the name")
                    .join(punct.span().into())
                    .unwrap_or(current_element.span.unwrap()),
            );
        }

        // Normal elements
        Some(TokenTree::Ident(ident)) => {
            let ident_str = ident.to_string();
            let current_tag = current_element.tag.clone();

            if ident_str
                != current_tag.expect("Current element to have tag name as the closing tag has it")
            {
                return Err(ParseError::new(
                    format!(
                        "Expected closing tag for the JSX element <{}>",
                        current_element.tag.unwrap_or(String::from("Unknown"))
                    )
                    .as_str(),
                    Some(ident.span()),
                ));
            }

            current_element.span = Some(
                current_element
                    .span
                    .expect("The span should be filled from the name")
                    .join(ident.span().into())
                    .unwrap_or(current_element.span.unwrap()),
            );
        }
        Some(token) => {
            return Err(ParseError::new(
                format!(
                    "Expected closing tag for the JSX element <{}>",
                    current_element.tag.unwrap_or(String::from(""))
                )
                .as_str(),
                Some(token.span()),
            ));
        }
        _ => {
            return Err(ParseError::new(
                format!(
                    "Expected closing tag for the JSX element <{}>",
                    current_element.tag.unwrap_or(String::from(""))
                )
                .as_str(),
                None,
            ));
        }
    }

    if !end_found {
        match iter.next() {
            Some(TokenTree::Punct(punct)) if punct.as_char() == '>' => {
                current_element.span = Some(
                    current_element
                        .span
                        .expect("The span should be filled from the name")
                        .join(punct.span().into())
                        .unwrap_or(current_element.span.unwrap()),
                );
            }
            Some(some) => {
                abort!(some.span(), "The element closing tag should end with '>'");
            }
            None => {
                abort!(
                    current_element
                        .span
                        .expect("The span of current element should be filled"),
                    "The element closing tag should end with '>'"
                );
            }
        }
    }

    Ok(current_element)
}

pub fn parse_jsx_syntax(input: TokenStream) -> Result<JsxElement, ParseError> {
    parse_jsx_element(&mut input.into_iter().peekable(), false)
}
