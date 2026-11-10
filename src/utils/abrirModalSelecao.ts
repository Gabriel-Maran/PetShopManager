import { Dispatch, SetStateAction } from "react";
import { ImageSourcePropType } from "react-native";

export type ModalConfig = {
  visivel: boolean;
  titulo: string;
  itemIcon?: ImageSourcePropType | ((item: any) => ImageSourcePropType);
  lista: any[];
  aoSelecionar: (item: any) => void;
};

export function abrirModalSelecao({
  titulo,
  lista,
  itemIcon,
  aoSelecionar,
  setModalConfig,
}: {
  titulo: string;
  itemIcon?: ImageSourcePropType | ((item: any) => ImageSourcePropType);
  lista: any[];
  aoSelecionar: (item: any) => void;
  setModalConfig: Dispatch<SetStateAction<ModalConfig>>;
}) {
  setModalConfig({
    visivel: true,
    titulo,
    itemIcon,
    lista,
    aoSelecionar: (item) => {
      aoSelecionar(item);

      setModalConfig((prev) => ({
        ...prev,
        visivel: false,
      }));
    },
  });
}
