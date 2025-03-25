import { BasePlaygroundBody } from "@/app/plugins/playground/page";

export default {
  // Test Profile Component
  "6396e8ae-6ff9-4676-93a9-f1fb8f140e8d": {
    props: {},
    component: BasePlaygroundBody,
  },
  "8d11e7ab-92d2-4157-bcba-b368921146e5": {
    props: {
      className: "bg-red-500",
      children: <p>This is a default text</p>,
    },
    component: DefaultSocigyElementInternal,
  },
};

export function DefaultSocigyElementInternal({
  children,
  className,
  ...rest
}: any) {
  return (
    <div className={className}>
      <p className="text-red-500">
        This is the default UI with External Plugin Children
      </p>
      {children}
      <p className="text-red-500">Here ends the default UI</p>
    </div>
  );
}
