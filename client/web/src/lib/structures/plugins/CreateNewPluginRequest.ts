import { PaymentType, PlatformType } from "./PluginStorePage";

export interface CreatePluginRequest {
  title: string;
  description?: string;

  paymentType: PaymentType;
  price?: number;

  platformType: PlatformType;
  icon: File;
}
