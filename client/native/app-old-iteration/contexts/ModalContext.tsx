import React from "react";
import { createContext, useContext, useState } from "react";

export interface ModalContextInfo {
  manager: {};
  queue: {};
}

const ModalContext = createContext<ModalContextInfo>({
  manager: {},
  queue: {},
});

export function ModalContextProvider({ children }: any) {
  const [state, setState] = useState();

  return <>{children}</>;
}

export default function useModals() {
  return useContext(ModalContext);
}
