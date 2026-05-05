// components/Pagination.tsx
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  // Mostra no máximo 5 páginas centradas na atual
  const getPages = () => {
    const pages: number[] = [];
    let start = Math.max(0, currentPage - 2);
    let end = Math.min(totalPages - 1, start + 4);
    start = Math.max(0, end - 4); // ajusta se chegou no fim

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <View style={styles.container}>
      {/* Anterior */}
      <TouchableOpacity
        style={[styles.btn, currentPage === 0 && styles.btnDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <Text style={styles.arrow}>‹</Text>
      </TouchableOpacity>

      {/* Números */}
      {getPages().map((page) => (
        <TouchableOpacity
          key={page}
          style={[styles.btn, page === currentPage && styles.btnActive]}
          onPress={() => onPageChange(page)}
        >
          <Text style={[styles.txt, page === currentPage && styles.txtActive]}>
            {page + 1}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Próximo */}
      <TouchableOpacity
        style={[
          styles.btn,
          currentPage === totalPages - 1 && styles.btnDisabled,
        ]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  btnActive: {
    backgroundColor: "#1D9E75",
    borderColor: "#1D9E75",
  },
  btnDisabled: {
    opacity: 0.3,
  },
  txt: { fontSize: 14, color: "#444" },
  txtActive: { color: "#fff", fontWeight: "600" },
  arrow: { fontSize: 20, color: "#444", lineHeight: 22 },
});
