import { Dispatch, SetStateAction } from "react";
import { ImageSourcePropType } from "react-native";

/** Um item do modal de seleção: o dono, a raça ou o pet, com o que a lista mostra. */
export interface SelectableItem {
  id?: number;
  name: string;
  owner_name?: string;
  species_name?: string;
  reschedule_active?: number;
}

export type ItemIcon = ImageSourcePropType | ((item: SelectableItem) => ImageSourcePropType);

export type ModalConfig = {
  visible: boolean;
  title: string;
  itemIcon?: ItemIcon;
  items: SelectableItem[];
  onSelect: (item: SelectableItem) => void;
};

export function openSelectionModal({
  title,
  items,
  itemIcon,
  onSelect,
  setModalConfig,
}: {
  title: string;
  itemIcon?: ItemIcon;
  items: SelectableItem[];
  onSelect: (item: SelectableItem) => void;
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
