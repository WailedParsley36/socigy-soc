use socigy::logging;
use socigy::ui::ui_component;
use socigy::{exports::*, ui::events::UIEvent, ui::ui};

use socigy::ui::bindings::register_component;
use socigy::ui::components::UIComponent;
use socigy::ui::elements::{PropStr, UIElement};
use socigy::utils::crypto::random_v4_uuid;
use socigy::{
    callback, error, info,
    permissions::{
        get_declared_permissions_async, get_permissions_async, request_permissions_async,
    },
};

mod ui;
use crate::ui::components::CounterBuilder;

/// This function is after the plugin API is initialized
/// Here you can register all of your UI elements or events
#[wasm_bindgen]
pub fn main() {
    logging::log(logging::LogLevel::Info, "Get Declared Permissions");
    get_declared_permissions_async(callback!(|permissions| { info!("{:#?}", permissions) }));

    logging::log(logging::LogLevel::Info, "Get Permissions Async");
    get_permissions_async(Box::new(|permissions| {
        let mut not_granted_permissions: Vec<String> = Vec::new();
        for permission in permissions {
            info!("{:?}", permission);

            if !permission.granted() {
                info!("Will request '{}' permission", permission.name());
                not_granted_permissions.push(permission.name().clone());
            }
        }

        logging::log(logging::LogLevel::Info, "Request Permissions Async");
        request_permissions_async(
            &not_granted_permissions,
            Box::new(|result| {
                for permission in result {
                    if !permission.granted() {
                        error!("Unable to get '{}' permission allowance", permission.name())
                    }
                }
            }),
        );
    }));

    let component_id = random_v4_uuid();
    register_component::<Page>(&component_id);
}

#[ui_component]
struct Page {
    render_string: bool,
    content: Option<PropStr>,
    image_url: Option<PropStr>,
}
struct Video {
    id: usize,
    title: String,
    speaker: String,
    url: String,
}
impl UIComponent for Page {
    fn render(&mut self) -> Option<UIElement> {
        info!("Rendering the Page component");
        let videos = vec![
            Video {
                id: 1,
                title: "Building and breaking things".to_string(),
                speaker: "John Doe".to_string(),
                url: "https://youtu.be/PsaFVLr8t4E".to_string(),
            },
            Video {
                id: 2,
                title: "The development process".to_string(),
                speaker: "Jane Smith".to_string(),
                url: "https://youtu.be/PsaFVLr8t4E".to_string(),
            },
            Video {
                id: 3,
                title: "The Web 7.0".to_string(),
                speaker: "Matt Miller".to_string(),
                url: "https://youtu.be/PsaFVLr8t4E".to_string(),
            },
            Video {
                id: 4,
                title: "Mouseless development".to_string(),
                speaker: "Tom Jerry".to_string(),
                url: "https://youtu.be/PsaFVLr8t4E".to_string(),
            },
        ];

        let video_elements: Vec<Option<UIElement>> = videos
            .iter()
            .map(|video| {
                ui! {
                    <View key={1.to_string()}>
                        <Text>{video.title.clone()}</Text>
                        <Text>Speaker:" "{video.speaker.clone()}</Text>
                        <Text>Url:" "{video.url.clone()}</Text>
                    </View>
                }
            })
            .collect();

        let a = |_e: &UIEvent| {};

        ui! {
            <View class_name="flex-1 flex b" on_layout={|e| {
                info!("OnLayout event was fired on Page. Event: {:?}", e);
            }} on_press={a}>
                <Text class_name="text-2xl font-inter-bold text-foreground">Your watchlist</Text>
                {
                    (|| {
                        if self.render_string {
                            ui! {
                                <>
                                    {video_elements.clone()}
                                    {video_elements}
                                </>
                            }
                        } else {
                            None
                        }
                    })()
                }
                <Counter render_string={self.render_string} image_url={self.image_url.clone().unwrap()} content={self.content.clone().unwrap()} />
            </View>
        }
    }

    fn mount(&mut self) {}

    fn unmount(&mut self) {}
}
