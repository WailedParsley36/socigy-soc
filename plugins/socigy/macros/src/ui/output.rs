use super::{errors::ParseError, types::JsxElement};
use quote::quote;

pub fn generate_output_for_element(
    element: &JsxElement,
) -> Result<proc_macro2::TokenStream, ParseError> {
    Ok(quote! { #element })
}
