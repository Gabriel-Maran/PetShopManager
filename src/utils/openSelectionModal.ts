import { Dispatch, SetStateAction } from "react";
import { ImageSourcePropType } from "react-native";

export type ModalConfig = {
  visible: boolean;
  title: string;
  itemIcon?: ImageSourcePropType | ((item: any) => ImageSourcePropType);
  items: any[];
  onSelect: (item: any) => void;
};

export function openSelectionModal({
  title,
  items,
  itemIcon,
  onSelect,
  setModalConfig,
}: {
  title: string;
  itemIcon?: ImageSourcePropType | ((item: any) => ImageSourcePropType);
  items: any[];
  onSelect: (item: any) => void;
  setModalConfig: Dispatch<SetStateAction<ModalConfig>>;
}) {
  setModalConfig({
    visible: true,
    title,
    itemIcon,
    items,
    onSelect: (item) => {
      onSelect(item);

      setModalConfig((prev) => ({
        ...prev,
        visible: false,
      }));
    },
  });
}
