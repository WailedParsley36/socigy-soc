use socigy::{
    info,
    ui::{
        components::UIComponent,
        elements::{PropStr, UIElement},
        ui, ui_component,
    },
};

#[ui_component]
pub struct Counter {
    render_string: bool,
    image_url: PropStr,
    content: PropStr,
}
impl UIComponent for Counter {
    fn render(&mut self) -> Option<UIElement> {
        info!("Rendering the Counter component");

        let names = vec!["Dynamic1", "Dynamic2", "Dynamic3"];
        let class_name = "bg-background";
        let test = names
            .iter()
            .map(|val| {
                ui! {
                    <View key={val.to_string()}>
                        <Text></Text>
                    </View>
                }
            })
            .collect::<Vec<Option<UIElement>>>();

        ui! {
            <>
                <View>
                    <External id="2580a897-0fcf-4d13-bfda-5472e1680fea">
                        <Text>
                            Normální text uvnitř element...,,,
                            <Text>I am Bold</Text>
                        </Text>
                    </External>

                    {
                        self.image_url.clone()
                    }

                    {
                        format!(" - Ahoj - {}", class_name)
                    }
                    {
                        ui! {
                            <View>
                                <Text>Dynamic Names</Text>
                                {
                                    names.iter().map(|val| {
                                        ui! {
                                            <View key={val.to_string()}>
                                                <Text>{*val}</Text>
                                            </View>
                                        }
                                    }).collect::<Vec<Option<UIElement>>>()
                                }
                                {
                                    test
                                }
                            </View>
                        }
                    }

                    <Text class_name="text-foreground font-inter-regular">Ja jsem dalsi text</Text>
                    <FlatList
                        on_end_reached={move |_e| {

                        }}
                        class_name={class_name}
                    />
                </View>
            </>
        }
    }

    fn mount(&mut self) {}

    fn unmount(&mut self) {}
}
