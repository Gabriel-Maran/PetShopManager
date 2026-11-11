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
import Pagination from "../list/Pagination";
import SearchBar from "../../searchBar/SearchBar";
import { ThemeColors, useThemedStyles } from "../../../theme/ThemeProvider";
import CloseButton from "../../CloseButton";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  RADIUS,
  SPACING,
} from "../../../theme/tokens";

interface SelectListModalProps {
  items: any[] | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  title: string;
  itemIcon?: ImageSourcePropType | ((item: any) => ImageSourcePropType);
  isPet?: boolean;
  page: number;
  total: number;
  setPage: (page: number) => void;
  setSearch: (txt: string) => void;
}

export default function SelectListModal({
  items,
  isOpen,
  onClose,
  onSelect,
  title,
  itemIcon,
  isPet,
  page,
  total,
  setPage,
  setSearch,
}: SelectListModalProps) {
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
              {title}
            </Text>
            <CloseButton onPress={onClose} />
          </View>

          <View style={s.searchWrap}>
            <SearchBar
              placeholderText={`Pesquisar...`}
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
                    {isPet ? `Nome: ` : ""}
                    {item.name}
                    {isPet ? `${"\n"}Dono(a): ${item.owner_name}` : null}
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
      borderRadius: RADIUS[16],
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
      paddingHorizontal: SPACING[16],
      paddingVertical: SPACING[14],
      borderBottomWidth: 1,
      borderColor: colors.BORDER_MID,
    },
    modalTitle: {
      flex: 1,
      fontSize: FONT_SIZE.BODY_LARGE,
      fontWeight: FONT_WEIGHT.BOLD,
      color: colors.TEXT_PRIMARY,
    },
    // Pesquisa
    searchWrap: {
      paddingHorizontal: SPACING[12],
      paddingVertical: SPACING[8],
      borderBottomWidth: 1,
      borderColor: colors.BORDER_MID,
    },

    // Lista
    listContent: {
      flexGrow: 1,
    },
    empty: {
      paddingVertical: SPACING[36],
      alignItems: "center",
    },
    emptyTxt: {
      fontSize: FONT_SIZE.BODY_SMALL,
      color: colors.TEXT_MUTED,
    },

    paginationWrap: {
      borderTopWidth: 1,
      borderColor: colors.BORDER_MID,
      paddingVertical: SPACING[4],
    },
    itemRow: {
      flexDirection: "row",
      paddingHorizontal: SPACING[20],
      paddingVertical: SPACING[15],
      borderBottomWidth: 1,
      borderBottomColor: colors.BORDER_MID,
    },
    itemIconRow: {
      width: 30,
      height: 30,
      marginRight: SPACING[12],
      resizeMode: "contain",
      alignSelf: "center",
    },
    itemText: {
      fontSize: FONT_SIZE.SUBTITLE,
      color: colors.TEXT_PRIMARY,
      alignSelf: "center",
    },
  });
