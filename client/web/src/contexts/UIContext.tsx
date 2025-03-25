// import DefaultComponents from "@/lib/plugins/DefaultComponents";
// import UIRegistry from "@/lib/plugins/UIRegistry";
// import { useContext } from "react";

// export function useUiComponent(
//   uiRegistry: UIRegistry,
//   id: keyof typeof DefaultComponents,
//   props: object,
//   defaultElement?: (props: any) => React.JSX.Element | undefined
// ) {
//   if (!defaultElement) {
//     defaultElement = uiRegistry.getDefaultCallable(id);
//   }

//   return (
//     <Dynamic
//       id={id}
//       props={props}
//       children={(props as any)?.children}
//       defaultElement={defaultElement}
//       uiRegistry={uiRegistry}
//     />
//   );
// }
// export function useUiRegistry() {
//   return useContext(UIRegistryContext);
// }
