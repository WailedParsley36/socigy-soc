use socigy::ui::{components::UIComponent, ui, ui_component};

#[ui_component]
pub struct Window {}

impl UIComponent for Window {
    fn render(&mut self) -> Option<socigy::ui::elements::UIElement> {
        ui! {
            <View>

            </View>
        }
    }

    fn mount(&mut self) {
        todo!()
    }

    fn unmount(&mut self) {
        todo!()
    }
}
