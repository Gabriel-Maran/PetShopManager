// components/Pagination.tsx
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";

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
  const s = useThemedStyles(styles);
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
    <View style={s.container}>
      {/* Anterior */}
      <TouchableOpacity
        style={[s.btn, currentPage === 0 && s.btnDisabled]}
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <Text style={s.arrow}>‹</Text>
      </TouchableOpacity>

      {/* Números */}
      {getPages().map((page) => (
        <TouchableOpacity
          key={page}
          style={[s.btn, page === currentPage && s.btnActive]}
          onPress={() => onPageChange(page)}
        >
          <Text style={[s.txt, page === currentPage && s.txtActive]}>
            {page + 1}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Próximo */}
      <TouchableOpacity
        style={[s.btn, currentPage === totalPages - 1 && s.btnDisabled]}
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <Text style={s.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      borderColor: colors.BORDER_STRONG,
      backgroundColor: colors.BACKGROUND,
    },
    btnActive: {
      backgroundColor: colors.PRIMARY_VARIANT,
      borderColor: colors.PRIMARY_VARIANT,
    },
    btnDisabled: {
      opacity: 0.3,
    },
    txt: {
      color: colors.TEXT_MUTED,
      fontSize: 14,
    },
    txtActive: {
      color: colors.TEXT_PRIMARY,
      fontWeight: "600",
    },
    arrow: {
      fontSize: 20,
      color: colors.BORDER_STRONG,
      lineHeight: 22,
    },
  });
