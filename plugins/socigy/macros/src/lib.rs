pub(crate) mod ui;

use proc_macro::TokenStream;
use proc_macro2::{Ident, Span};
use proc_macro_crate::{crate_name, FoundCrate};
use proc_macro_error::{abort, proc_macro_error};
use quote::{format_ident, quote, TokenStreamExt};
use syn::DeriveInput;
use ui::{
    derive::{
        extract_ident_attr, extract_literal_attr, generate_field_build, generate_field_function,
        FieldType,
    },
    input::parse_jsx_syntax,
    output::generate_output_for_element,
};

fn str_from_found_crate(found: FoundCrate) -> String {
    match found {
        FoundCrate::Itself => "crate".into(),
        FoundCrate::Name(str) => str,
    }
}

fn get_crate_name() -> Ident {
    let span = Span::call_site();
    crate_name("socigy")
        .map(|name| Ident::new(str_from_found_crate(name).as_str(), span)) // Get the correct name
        .unwrap_or_else(|_| Ident::new("socigy", span))
}

#[proc_macro]
#[proc_macro_error]
pub fn ui(input: TokenStream) -> TokenStream {
    if input.is_empty() {
        return quote! { None }.into();
    }

    let parsed_element = match parse_jsx_syntax(input) {
        Ok(res) => res,
        Err(e) => {
            abort!(e.span.unwrap_or(Span::call_site().unwrap()), e.message);
        }
    };
    match generate_output_for_element(&parsed_element) {
        Ok(res) => {
            eprintln!("ELEMENT OUT\r\n\r\n{:#?}\r\n\r\n", parsed_element);
            eprintln!("OUTPUT\r\n\r\n{}\r\n\r\n", res.to_string());

            if res.is_empty() {
                quote! { None }.into()
            } else {
                quote! { Some(#res) }.into()
            }
        }
        Err(e) => {
            abort!(e.span.unwrap_or(Span::call_site().unwrap()), e.message);
        }
    }
}

#[proc_macro_error]
#[proc_macro_derive(UIProps, attributes(default, default_value, default_function))]
pub fn ui_prop_derive(input: TokenStream) -> TokenStream {
    // Parse the input tokens into a syntax tree
    let ast = syn::parse_macro_input!(input as DeriveInput);

    // Get the name of the struct
    let name = &ast.ident;

    let fields = match ast.data {
        syn::Data::Struct(struct_data) => struct_data.fields,
        _ => {
            abort!(name.span(), "This macro can be used only on structs");
        }
    };

    let mut field_types: Vec<FieldType> = vec![];
    let mut generated_functions: proc_macro2::TokenStream = proc_macro2::TokenStream::new();
    let mut generated_builds: Vec<proc_macro2::TokenStream> = vec![];

    for field in fields {
        let field_name = field.ident;
        let field_type = &field.ty;
        let mut field_missing = true;
        for attr in &field.attrs {
            let attr_ident = match attr.path().get_ident() {
                Some(a) => a,
                None => continue,
            };

            match attr_ident.to_string().as_str() {
                "default" => {
                    let field_type = FieldType::Default(
                        field_name
                            .as_ref()
                            .expect("Expected field to have identifier")
                            .clone(),
                        field_type.clone(),
                    );
                    generated_functions.append_all(generate_field_function(&field_type));
                    generated_builds.push(generate_field_build(&field_type));
                    field_types.push(field_type);

                    // The field should have only one attribute
                    field_missing = false;
                    break;
                }
                "default_value" => {
                    let field_type = FieldType::DefaultValue(
                        field_name
                            .as_ref()
                            .expect("Expected field to have identifier")
                            .clone(),
                        field_type.clone(),
                        extract_literal_attr(attr),
                    );
                    generated_functions.append_all(generate_field_function(&field_type));
                    generated_builds.push(generate_field_build(&field_type));
                    field_types.push(field_type);

                    // The field should have only one attribute
                    field_missing = false;
                    break;
                }
                "default_function" => {
                    let field_type = FieldType::DefaultFunction(
                        field_name
                            .as_ref()
                            .expect("Expected field to have identifier")
                            .clone(),
                        field_type.clone(),
                        extract_ident_attr(attr),
                    );
                    generated_functions.append_all(generate_field_function(&field_type));
                    generated_builds.push(generate_field_build(&field_type));
                    field_types.push(field_type);

                    // The field should have only one attribute
                    field_missing = false;
                    break;
                }
                _ => {}
            }
        }

        if field_missing {
            let field_type = FieldType::Required(
                field_name
                    .as_ref()
                    .expect("Expected field to have identifier")
                    .clone(),
                field_type.clone(),
            );
            generated_functions.append_all(generate_field_function(&field_type));
            generated_builds.push(generate_field_build(&field_type));
            field_types.push(field_type);
        }
    }

    let mut result: proc_macro2::TokenStream = proc_macro2::TokenStream::new();

    let ident = format_ident!("{}Builder", name);

    result.append_all(quote! {

        #[derive(Default)]
        pub struct #ident {
            #(#field_types),*
        }

        impl #ident {
            #generated_functions

            pub fn build(self) -> #name {
                #name
                {
                    #(#generated_builds),*
                }
            }
        }
    });

    result.into()
}

#[proc_macro_attribute]
pub fn ui_component(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input: proc_macro2::TokenStream = item.into();
    let lib_name = get_crate_name(); // Fallback for internal use

    quote! {
        #[derive(#lib_name::ui::UIProps, ::serde::Serialize, ::serde::Deserialize, ::core::cmp::PartialEq)]
        #[serde(rename_all = "camelCase")]
        #input
    }.into()
}
