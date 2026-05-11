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

interface ModalSelectListProps {
  items: any[] | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  titulo: string;
  itemIcon?: ImageSourcePropType;
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
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.modalContent} onPress={() => {}}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{titulo}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.searchWrap}>
            <BarraDePesquisa
              placeHolderStr={`Pesquisar...`}
              setSearch={setSearch}
            />
          </View>

          <FlatList
            data={items}
            contentContainerStyle={s.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.itemRow}
                onPress={() => onSelect(item)}
              >
                {itemIcon && <Image source={itemIcon} style={s.itemIconRow} />}
                <Text style={s.itemText}>{item.nome}</Text>
              </TouchableOpacity>
            )}
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
      shadowColor: "#000",
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
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.PRIMARY_SOFT,
      justifyContent: "center",
      alignItems: "center",
    },

    closeIcon: {
      fontSize: 13,
      lineHeight: 15,
      color: colors.PRIMARY,
      fontWeight: "600",
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
      width: 24, 
      height: 24,
      marginRight: 12, 
      resizeMode: "contain",
    },
    itemText: {
      fontSize: 16,
      color: colors.TEXT_PRIMARY,
    },
  
  });
