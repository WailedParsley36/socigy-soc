import {
  DefaultSocigyElementInternal,
  TestProfileComponentInternal,
} from "@/app/app/profile";
import { Text } from "react-native";

export default {
  // Test Profile Component
  "6396e8ae-6ff9-4676-93a9-f1fb8f140e8d": {
    props: {},
    component: TestProfileComponentInternal,
  },
  "8d11e7ab-92d2-4157-bcba-b368921146e5": {
    props: {
      className: "bg-red-500",
      children: <Text>I am here too from the defaults</Text>,
    },
    component: DefaultSocigyElementInternal,
  },
};
