import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Pressable,
  ImageSourcePropType,
} from "react-native";
import { LIMIT_ITEM_PAGE } from "../../../../config/consts";
import Pagination from "../List/Pagination";
import BarraDePesquisa from "../../SearchBarra/BarraDePesquisa";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";
import CloseButton from "../../CloseButton";

interface ModalSelectListProps {
  items: any[] | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  titulo: string;
  itemIcon?: ImageSourcePropType | ((item: any) => ImageSourcePropType);
  ehPet?: boolean;
  page: number;
  total: number;
  setPage: (page: number) => void;
  setSearch: (txt: string) => void;
}

export default function ModalSelectList({
  items,
  isOpen,
  onClose,
  onSelect,
  titulo,
  itemIcon,
  ehPet,
  page,
  total,
  setPage,
  setSearch,
}: ModalSelectListProps) {
  const s = useThemedStyles(styles);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Os Pressable só fecham ao tocar fora; sem accessible, o leitor percorre o conteúdo item a item. */}
      <Pressable style={s.overlay} onPress={onClose} accessible={false}>
        <Pressable
          style={s.modalContent}
          onPress={() => {}}
          accessible={false}
        >
          <View style={s.modalHeader}>
            <Text style={s.modalTitle} accessibilityRole="header">
              {titulo}
            </Text>
            <CloseButton onPress={onClose} />
          </View>

          <View style={s.searchWrap}>
            <BarraDePesquisa
              placeHolderStr={`Pesquisar...`}
              setSearch={setSearch}
            />
          </View>
          <FlatList
            data={items ?? []}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => {
              const iconSource =
                typeof itemIcon === "function" ? itemIcon(item) : itemIcon;
              return (
                <TouchableOpacity
                  style={s.itemRow}
                  onPress={() => onSelect(item)}
                  accessibilityRole="button"
                >
                  {iconSource && (
                    <Image source={iconSource} style={s.itemIconRow} />
                  )}
                  <Text style={s.itemText}>
                    {ehPet ? `Nome: ` : ""}
                    {item.nome}
                    {ehPet ? `${"\n"}Dono(a): ${item.nome_dono}` : null}
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item, index) =>
              item.id?.toString() ?? index.toString()
            }
          />

          {/* Paginação — abaixo da lista */}
          <View style={s.paginationWrap}>
            <Pagination
              currentPage={page}
              totalItems={total}
              itemsPerPage={LIMIT_ITEM_PAGE}
              onPageChange={setPage}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.MODAL_BACKGROUND,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "88%",
      height: "80%",
      backgroundColor: colors.BACKGROUND,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 6,
      shadowColor: colors.SHADOW,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },

    // Cabeçalho
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: colors.BORDER_MID,
    },
    modalTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: colors.TEXT_PRIMARY,
    },
    // Pesquisa
    searchWrap: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.BORDER_MID,
    },

    // Lista
    listContent: {
      flexGrow: 1,
    },
    empty: {
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyTxt: {
      fontSize: 13,
      color: colors.TEXT_MUTED,
    },

    paginationWrap: {
      borderTopWidth: 1,
      borderColor: colors.BORDER_MID,
      paddingVertical: 4,
    },
    itemRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_MID,
    },
    itemIconRow: {
      width: 30,
      height: 30,
      marginRight: 12,
      resizeMode: "contain",
      alignSelf: "center",
    },
    itemText: {
      fontSize: 16,
      color: colors.TEXT_PRIMARY,
      alignSelf: "center",
    },
  });
