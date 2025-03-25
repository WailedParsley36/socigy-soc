use core::fmt;

#[derive(Debug, Clone)]
pub struct ParseError {
    pub message: String,
    pub span: Option<proc_macro::Span>,
}

impl ParseError {
    pub fn new(message: &str, span: Option<proc_macro::Span>) -> ParseError {
        ParseError {
            message: String::from(message),
            span,
        }
    }
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Failed to parse the ui! input. Please double-check your syntax. {}",
            self.message.as_str()
        )
    }
}
