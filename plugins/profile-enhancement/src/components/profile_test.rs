use socigy::ui::{
    components::UIComponent,
    elements::{UIElement, UIElementChildren},
    ui, ui_component,
};

#[ui_component]
pub struct ProfileTest {
    children: Option<Vec<UIElementChildren>>,

    #[default("Unmounted")]
    status: String,
}

impl UIComponent for ProfileTest {
    fn render(&mut self) -> Option<UIElement> {
        ui!(
            <>
                <Text class_name="text-foreground">This is the new and improved UI</Text>
                <Text class_name="text-level-5">Current Plugin Component status: {self.status.clone()}</Text>
                {self.children.clone()}
                <Test>
                    <Text class_name="text-foreground">This is a test</Text>
                </Test>
            </>
        )
    }

    fn mount(&mut self) {
        self.status = "Mounted".to_string();
    }

    fn unmount(&mut self) {
        self.status = "Unmounted".to_string();
    }
}

#[ui_component]
pub struct Test {
    children: Option<Vec<UIElementChildren>>,
}

impl UIComponent for Test {
    fn render(&mut self) -> Option<UIElement> {
        ui!(
            <>
                <Text class_name="text-foreground">I am above my passed UI children</Text>
                {self.children.clone()}
            </>
        )
    }

    fn mount(&mut self) {}

    fn unmount(&mut self) {}
}
