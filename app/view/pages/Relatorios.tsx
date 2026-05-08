import { useEffect, useState } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import DefaultHeader from "../components/Header/DefaultHeader";
import ModalSelectList from "../components/Cadastro/Modal/ModalSelectList";
import { ownerController } from "../../controller/OwnerController";
import { useError } from "../../hooks/useError";
import { Owner } from "../../model/Owner";
import { Pet } from "../../model/Pet";
import { COLORS, LIMIT_ITEM_PAGE, ORDER } from "../../config/consts";

export default function Relatorios() {
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTxt, setSearchTxt] = useState("");
  const [owners, setOwners] = useState<Owner[] | undefined | null>();
  const [itemSelected, setItemSelected] = useState<Owner | Pet | undefined>();
  const { showError } = useError();

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  // Contagem total
  useEffect(() => {
    ownerController.countOwners().then(setTotal).catch(handleError);
  }, []);

  // Busca com debounce — espera 400ms após o usuário parar de digitar
  useEffect(() => {
    try {
      ownerController
        .searchOwnersByNamePaged(searchTxt, page, LIMIT_ITEM_PAGE, ORDER.DESC)
        .then(setOwners)
        .catch(handleError);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }, [searchTxt, page]);

  return (
    <View style={styles.container}>
      <DefaultHeader />

      <Button title="ABRIR MODAL" onPress={() => setIsOpen(true)} />

      <Text style={styles.selected}>
        {itemSelected?.nome ?? "Nenhum selecionado"}
      </Text>

      <ModalSelectList
        isOpen={isOpen}
        isOwner={true}
        items={owners}
        page={page}
        total={total}
        onClose={() => setIsOpen(false)}
        onSelect={(item) => {
          setItemSelected(item);
          setIsOpen(false);
        }}
        setPage={setPage}
        setSearch={(txt) => {
          setPage(0);
          setSearchTxt(txt);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND ?? "#FFF",
  },
  selected: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
  },
});
