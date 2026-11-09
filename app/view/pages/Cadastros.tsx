import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useSearchPage } from "../../hooks/useSearchPage";

import { PetWithSpecieRaceAndOwner } from "../../model/Pet";
import { Owner } from "../../model/Owner";
import type { NameSearch } from "../../model/Search";

import { ownerController } from "../../controller/OwnerController";
import { petController } from "../../controller/PetController";

import {
  APP_BAR_HEIGHT,
  LIMIT_ITEM_PAGE,
  NewOrEditCadastros,
  ORDER,
  Screen,
} from "../../config/consts";

import BarraDePesquisa from "../components/SearchBarra/BarraDePesquisa";
import DefaultHeader from "../components/Header/DefaultHeader";
import ItemSelect from "../components/Cadastro/ItemSelect";
import PetList from "../components/Cadastro/List/PetList";
import Pagination from "../components/Cadastro/List/Pagination";
import OwnerList from "../components/Cadastro/List/OwnerList";
import ModalConfDelete from "../components/Cadastro/Botões/Delete/ModalConfDelete";
import { ThemeColors, useThemedStyles } from "../Themes/ThemeProvider";

type CadastroItem = Owner | PetWithSpecieRaceAndOwner;

export default function Cadastros() {
  const { navigate, params } = useScreen<NewOrEditCadastros>();

  const s = useThemedStyles(styles);

  const [isOwnerSelected, setIsOwnerSelected] = useState(params?.type != "PET");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [itemToDeactivate, setItemToDeactivate] = useState<
    CadastroItem | undefined
  >();
  const [isAtivo, setIsAtivo] = useState(1);

  const handleTabChange = (value: boolean) => {
    setIsOwnerSelected(value);
    setSearch("");
    setPage(0);
  };

  const nameSearch: NameSearch = {
    query: search,
    ativo: isAtivo,
    page,
    limit: LIMIT_ITEM_PAGE,
    order: ORDER.DESC,
  };
  const searchDeps = [search, page, isAtivo];

  // A lista e o total vêm da mesma busca. Só a aba aberta busca, e uma resposta atrasada é descartada.
  const owners = useSearchPage(
    () => ownerController.searchOwnersPage(nameSearch),
    searchDeps,
    isOwnerSelected,
  );
  const pets = useSearchPage(
    () => petController.searchPetsPage(nameSearch),
    searchDeps,
    !isOwnerSelected,
  );
  const { total, reload } = isOwnerSelected ? owners : pets;

  // Depois de desativar o último item da última página, volta para a página anterior.
  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(total / LIMIT_ITEM_PAGE) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [total]);

  // A lista só muda depois que o banco confirma, e a busca de novo traz a página e o total certos.
  // Uma falha aparece no modal de erro, e o item fica.
  const deactivate = useAsyncAction(async (itemId: number) => {
    await (isOwnerSelected
      ? ownerController.deleteOwner(itemId)
      : petController.deletePet(itemId));
    reload();
  });

  const activate = useAsyncAction(async (itemId: number) => {
    await (isOwnerSelected
      ? ownerController.activeOwner(itemId)
      : petController.activePet(itemId));
    reload();
  });

  // O nome do modal vem da própria lista, sem ir ao banco.
  function askToDeactivate(itemId: number) {
    const items: CadastroItem[] = isOwnerSelected ? owners.items : pets.items;
    setItemToDeactivate(items.find((item) => item.id === itemId));
  }

  function confirmDeactivate() {
    const itemId = itemToDeactivate?.id;
    setItemToDeactivate(undefined);
    if (itemId !== undefined) deactivate.run(itemId);
  }

  return (
    <>
      <ModalConfDelete
        message={`Desativando o ${isOwnerSelected ? "dono" : "pet"} ${itemToDeactivate?.nome}`}
        onClose={() => setItemToDeactivate(undefined)}
        onConfirmDelete={confirmDeactivate}
        visible={itemToDeactivate !== undefined}
      />

      <View style={s.container}>
        <DefaultHeader />

        <BarraDePesquisa
          placeHolderStr={`Pesquisar por ${isOwnerSelected ? "Dono(s)" : "Pet(s)"}`}
          setSearch={(txt) => {
            setPage(0); // Volta pra página 1 a cada nova busca
            setSearch(txt);
          }}
          hasFilter={true}
          onStatusFiltroChange={(item: number) => {
            setPage(0);
            setIsAtivo(item);
          }}
          statusFiltro={isAtivo ? "ativo" : "inativo"}
        />

        <View style={s.escolhaItem}>
          <ItemSelect
            title="Donos"
            isThisSelected={isOwnerSelected}
            setValorSelect={handleTabChange}
            valorSelect={true}
          />
          <ItemSelect
            title="Pets"
            isThisSelected={!isOwnerSelected}
            setValorSelect={handleTabChange}
            valorSelect={false}
          />
        </View>

        <Pagination
          currentPage={page}
          totalItems={total}
          itemsPerPage={LIMIT_ITEM_PAGE}
          onPageChange={setPage}
        />

        <View style={{ flex: 1 }}>
          {isOwnerSelected ? (
            <OwnerList
              saoAtivados={isAtivo == 1}
              cadastros={owners.items}
              onDelete={askToDeactivate}
              onActive={activate.run}
            />
          ) : (
            <PetList
              saoAtivados={isAtivo == 1}
              cadastros={pets.items}
              onDelete={askToDeactivate}
              onActive={activate.run}
            />
          )}
        </View>
      </View>

      <View style={s.ctnBtnAdd}>
        <TouchableOpacity
          style={s.btnAdd}
          onPress={() =>
            navigate(
              isOwnerSelected ? Screen.NewOrEditOwner : Screen.NewOrEditPet,
            )
          }
        >
          <Image
            style={s.imgAdd}
            source={require("../../assets/crud/addWhite.png")}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.THIRD_BACKGROUND,
      marginBottom: APP_BAR_HEIGHT,
    },
    escolhaItem: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginTop: 15,
    },
    ctnBtnAdd: {
      position: "absolute",
      bottom: APP_BAR_HEIGHT + 25,
      right: 25,
    },
    btnAdd: {
      backgroundColor: colors.PRIMARY,
      borderRadius: 32.5,
      width: 65,
      height: 65,
      justifyContent: "center",
      alignItems: "center",
    },
    imgAdd: {
      width: 40,
      height: 40,
    },
  });
