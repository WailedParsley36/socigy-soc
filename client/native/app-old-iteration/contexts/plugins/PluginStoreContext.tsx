import { UserTagInfo } from "@/components/frames/edit/Types";
import React, { createContext, useContext, useEffect, useState } from "react";





const SelectedImagesContext =
  createContext<PluginStoreContextInfo>(initialValue);

export function SelectedImagesContextProvider({ children }: any) {
  const [selectedImages, setSelectedImages] =
    useState<SelectedImagesContextInfo>(initialValue);

  useEffect(() => {
    function update(
      value: React.SetStateAction<{
        images: ImageInfo[];
        indexedImages: IndexedImages;
      }>
    ) {
      if (typeof value === "function") {
        setSelectedImages((prev) => ({ ...value(prev), update: update }));
      } else setSelectedImages({ ...value, update: update });
    }

    setSelectedImages({ ...selectedImages, update: update });
  }, []);

  return (
    <SelectedImagesContext.Provider value={selectedImages}>
      {children}
    </SelectedImagesContext.Provider>
  );
}

export default function useSelectedImages() {
  return useContext(SelectedImagesContext);
}
