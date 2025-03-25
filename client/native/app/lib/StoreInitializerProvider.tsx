import { useAuthStore } from "@/stores/AuthStore";
import { useEffect } from "react";

export default function StoreInitializerProvider({ children }: any) {
  const auth = useAuthStore();

  useEffect(() => {
    if (!auth._hasHydrated || auth.isInitialized) {
      return;
    }

    console.log("HYDRATED NOW");

    async function initialization() {
      if (!(await auth.initialize())) return;
    }

    initialization();
  }, [auth]);

  return children;
}
