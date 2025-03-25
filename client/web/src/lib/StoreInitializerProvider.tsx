"use client";
import { useAuthStore } from "@/stores/AuthStore";
import { usePluginStore } from "@/stores/PluginStorev2";
import { useEffect } from "react";

export default function StoreInitializerProvider({ children }: any) {
  const auth = useAuthStore();
  const plugins = usePluginStore();

  useEffect(() => {
    async function initialization() {
      if (!(await auth.initialize())) return;

      await plugins.initialize();
    }

    initialization();
  }, []);

  return children;
}
