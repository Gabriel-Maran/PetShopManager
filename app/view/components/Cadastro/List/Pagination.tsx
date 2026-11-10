// components/Pagination.tsx
import { StyleSheet, Text, View } from "react-native";
import { ThemeColors, useThemedStyles } from "../../../Themes/ThemeProvider";
import { A11Y_LABELS } from "../../../../globals/accessibilityLabels";
import IconButton from "../../Acessibilidade/IconButton";

const BUTTON_SIZE = 36;

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
      <IconButton
        label={A11Y_LABELS.pagination.previous}
        width={BUTTON_SIZE}
        style={[s.btn, currentPage === 0 && s.btnDisabled]}
        onPress={() => {
          if (currentPage > 0) {
            onPageChange(currentPage - 1);
          }
        }}
        disabled={currentPage === 0}
      >
        <Text style={s.arrow}>‹</Text>
      </IconButton>

      {/* Números */}
      {getPages().map((page) => (
        <IconButton
          key={page}
          label={A11Y_LABELS.pagination.page(page + 1)}
          width={BUTTON_SIZE}
          accessibilityState={{ selected: page === currentPage }}
          style={[s.btn, page === currentPage && s.btnActive]}
          onPress={() => onPageChange(page)}
        >
          <Text style={[s.txt, page === currentPage && s.txtActive]}>
            {page + 1}
          </Text>
        </IconButton>
      ))}

      {/* Próximo */}
      <IconButton
        label={A11Y_LABELS.pagination.next}
        width={BUTTON_SIZE}
        style={[s.btn, currentPage === totalPages - 1 && s.btnDisabled]}
        onPress={() => {
          if (currentPage < totalPages - 1) {
            onPageChange(currentPage + 1);
          }
        }}
        disabled={currentPage === totalPages - 1}
      >
        <Text style={s.arrow}>›</Text>
      </IconButton>
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
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
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
    // Texto sobre o verde cheio usa a cor do fundo, como nos botões Salvar: passa 4,5:1 nos dois temas.
    txtActive: {
      color: colors.BACKGROUND,
      fontWeight: "600",
    },
    arrow: {
      fontSize: 20,
      color: colors.TEXT_MUTED,
      lineHeight: 22,
    },
  });
