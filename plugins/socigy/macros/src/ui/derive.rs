use proc_macro2::{Delimiter, Ident, Literal, TokenStream, TokenTree};
use proc_macro_error::abort;
use quote::{quote, ToTokens, TokenStreamExt};
use syn::{spanned::Spanned, Attribute};

pub(crate) enum FieldType {
    Required(::syn::Ident, ::syn::Type),
    Default(::syn::Ident, ::syn::Type),
    DefaultValue(::syn::Ident, ::syn::Type, proc_macro2::TokenStream),
    DefaultFunction(::syn::Ident, ::syn::Type, proc_macro2::TokenStream),
}

impl ToTokens for FieldType {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let (ident, field_type) = get_field_type_details(self);

        if is_type_option(field_type) {
            tokens.append_all(quote! {
                #ident: #field_type
            })
        } else {
            tokens.append_all(quote! {
                #ident: Option<#field_type>
            })
        }
    }
}

fn is_type_option(ty: &::syn::Type) -> bool {
    if let ::syn::Type::Path(type_path) = ty {
        if let Some(segment) = type_path.path.segments.last() {
            return segment.ident == "Option";
        }
    }
    false
}
fn get_inner_type_of_option(ty: &syn::Type) -> Option<&syn::Type> {
    if let syn::Type::Path(syn::TypePath { path, .. }) = ty {
        if let Some(last_segment) = path.segments.last() {
            if last_segment.ident == "Option" {
                if let syn::PathArguments::AngleBracketed(args) = &last_segment.arguments {
                    if let Some(syn::GenericArgument::Type(inner_type)) = args.args.first() {
                        return Some(inner_type);
                    }
                }
            }
        }
    }
    None
}
fn get_field_type_details(field: &FieldType) -> (&::syn::Ident, &::syn::Type) {
    match field {
        FieldType::Default(ident, ty) => (ident, ty),
        FieldType::DefaultValue(ident, ty, _) => (ident, ty),
        FieldType::DefaultFunction(ident, ty, _) => (ident, ty),
        FieldType::Required(ident, ty) => (ident, ty),
    }
}

pub(crate) fn generate_field_function(field: &FieldType) -> proc_macro2::TokenStream {
    let (name, ty) = get_field_type_details(field);

    if is_type_option(ty) {
        let without_option = get_inner_type_of_option(ty);

        quote! {
            pub fn #name(mut self, #name: #without_option) -> Self {
                self.#name = Some(#name);
                self
            }
        }
    } else {
        quote! {
            pub fn #name(mut self, #name: #ty) -> Self {
                self.#name = Some(#name);
                self
            }
        }
    }
}
pub(crate) fn generate_field_build(field: &FieldType) -> proc_macro2::TokenStream {
    match field {
        FieldType::Default(ident, _) => {
            quote! {
                #ident: self.#ident.unwrap_or_default()
            }
        }
        FieldType::DefaultValue(ident, _, expr) => {
            quote! {
                #ident: self.#ident.unwrap_or(#expr.into())
            }
        }
        FieldType::DefaultFunction(ident, _, expr) => {
            quote! {
                #ident: self.#ident.unwrap_or_else(#expr)
            }
        }
        FieldType::Required(ident, ty) => {
            if is_type_option(ty) {
                quote! {
                    #ident: self.#ident.clone()
                }
            } else {
                quote! {
                    #ident: self.#ident.expect(&format!("Expected {} to be passed", stringify!(#ident)))
                }
            }
        }
    }
}

fn get_first_group_parentheses(tokens: TokenStream) -> Option<TokenStream> {
    for token in tokens.into_iter() {
        if let TokenTree::Group(group) = token {
            if group.delimiter() == Delimiter::Parenthesis {
                return Some(group.stream());
            } else {
                return get_first_group_parentheses(group.stream());
            }
        }
    }
    None
}
fn is_single_literal(tokens: TokenStream) -> Option<Literal> {
    let mut iter = tokens.into_iter();
    if let Some(TokenTree::Literal(lit)) = iter.next() {
        if iter.next().is_none() {
            return Some(lit);
        }
    }
    None
}
fn is_single_ident(tokens: TokenStream) -> Option<Ident> {
    let mut iter = tokens.into_iter();
    if let Some(TokenTree::Ident(ident)) = iter.next() {
        if iter.next().is_none() {
            return Some(ident);
        }
    }
    None
}

pub(crate) fn extract_literal_attr(attr: &Attribute) -> TokenStream {
    let result: Option<proc_macro2::TokenStream> =
        get_first_group_parentheses(attr.to_token_stream());

    if result.is_none() {
        abort!(attr.span(), "Expected a default value for attribute");
    }

    let result_unwrap: TokenStream = result.unwrap();
    let lit_result = is_single_literal(result_unwrap);
    if lit_result.is_none() {
        abort!(attr.span(), "Expected a valid default value for attribute");
    }

    lit_result.to_token_stream()
}

pub(crate) fn extract_ident_attr(attr: &Attribute) -> TokenStream {
    let result: Option<proc_macro2::TokenStream> =
        get_first_group_parentheses(attr.to_token_stream());

    if result.is_none() {
        abort!(attr.span(), "Expected a default value for attribute");
    }

    let result_unwrap: TokenStream = result.unwrap();
    let ident_result = is_single_ident(result_unwrap);
    if ident_result.is_none() {
        abort!(attr.span(), "Expected a valid default value for attribute");
    }

    ident_result.to_token_stream()
}
