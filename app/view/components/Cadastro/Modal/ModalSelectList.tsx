import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { COLORS, LIMIT_ITEM_PAGE } from "../../../../config/consts";
import OwnerListModal from "./OwnerListModal";
import PetListModal from "./PetListModal";
import { Pet } from "../../../../model/Pet";
import { Owner } from "../../../../model/Owner";
import Pagination from "../List/Pagination";
import BarraDePesquisa from "../../SearchBarra/BarraDePesquisa";

interface ModalSelectListProps {
  items: any[] | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  isOwner: boolean;
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
  isOwner,
  page,
  total,
  setPage,
  setSearch,
}: ModalSelectListProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          {/* Cabeçalho */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Selecionar {isOwner ? "Tutor" : "Pet"}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Pesquisa */}
          <View style={styles.searchWrap}>
            <BarraDePesquisa
              placeHolderStr={`Pesquisar ${isOwner ? "tutor" : "pet"}...`}
              setSearch={setSearch}
            />
          </View>

          {/* Lista */}
          <FlatList
            data={items}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTxt}>
                  Nenhum {isOwner ? "tutor" : "pet"} encontrado.
                </Text>
              </View>
            }
            renderItem={({ item }) =>
              isOwner ? (
                <OwnerListModal onSelect={onSelect} item={item as Owner} />
              ) : (
                <PetListModal onSelect={onSelect} item={item as Pet} />
              )
            }
            keyExtractor={(item, index) =>
              item.id?.toString() ?? index.toString()
            }
          />

          {/* Paginação — abaixo da lista */}
          <View style={styles.paginationWrap}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "88%",
    height: "80%",
    backgroundColor: COLORS.BACKGROUND,
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
    borderColor: COLORS.BORDER_MID,
  },
  modalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY_SOFT,
    justifyContent: "center",
    alignItems: "center",
  },

  closeIcon: {
    fontSize: 13,
    lineHeight: 15,
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },

  // Pesquisa
  searchWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.BORDER_MID,
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
    color: COLORS.TEXT_MUTED,
  },

  // Paginação — ✅ movida para baixo da lista
  paginationWrap: {
    borderTopWidth: 1,
    borderColor: COLORS.BORDER_MID,
    paddingVertical: 4,
  },
});
