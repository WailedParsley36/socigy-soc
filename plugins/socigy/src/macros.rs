use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Expr};

#[proc_macro]
pub fn ui(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as Expr);

    let expanded = quote! {
        my_renderer::UIElement::from(#input)
    };

    TokenStream::from(expanded)
}
