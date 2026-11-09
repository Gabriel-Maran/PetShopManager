import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useError } from "../../hooks/useError";
import { useAsyncAction } from "../../hooks/useAsyncAction";

import { PetWithSpecieRaceAndOwner } from "../../model/Pet";
import { Owner } from "../../model/Owner";

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
  const { showError } = useError();

  const s = useThemedStyles(styles);

  const [isOwnerSelected, setIsOwnerSelected] = useState(params?.type != "PET");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pets, setPets] = useState<PetWithSpecieRaceAndOwner[]>([]);
  const [total, setTotal] = useState(0);
  const [itemToDeactivate, setItemToDeactivate] = useState<
    CadastroItem | undefined
  >();
  const [isAtivo, setIsAtivo] = useState(1);

  const handleTabChange = (value: boolean) => {
    setIsOwnerSelected(value);
    setSearch("");
    setPage(0);
  };

  // Contagem total — recalcula ao trocar de aba
  useEffect(() => {
    const count = isOwnerSelected
      ? ownerController.countOwners(search)
      : petController.countPets(search);
    count.then(setTotal).catch(showError);
  }, [isOwnerSelected, search]);

  // Busca — só dispara quando search muda (botão) ou ao trocar página/aba
  useEffect(() => {
    const fetch = isOwnerSelected
      ? ownerController
          .searchOwnersByNamePaged(
            search,
            page,
            LIMIT_ITEM_PAGE,
            ORDER.DESC,
            isAtivo,
          )
          .then(setOwners)
      : petController
          .searchPetsByNamePagedWithSpecieAndRace(
            search,
            page,
            LIMIT_ITEM_PAGE,
            ORDER.DESC,
            isAtivo,
          )
          .then(setPets);
    fetch.catch(showError);
  }, [search, page, isOwnerSelected, isAtivo]);

  /** Tira da aba aberta o item que mudou de status, porque ele passa para o outro filtro. */
  function removeFromList(itemId: number) {
    if (isOwnerSelected) {
      setOwners((prev) => prev.filter((item) => item.id !== itemId));
    } else {
      setPets((prev) => prev.filter((item) => item.id !== itemId));
    }
  }

  // A lista só muda depois que o banco confirma. Uma falha aparece no modal de erro, e o item fica.
  const deactivate = useAsyncAction(async (itemId: number) => {
    await (isOwnerSelected
      ? ownerController.deleteOwner(itemId)
      : petController.deletePet(itemId));
    removeFromList(itemId);
  });

  const activate = useAsyncAction(async (itemId: number) => {
    await (isOwnerSelected
      ? ownerController.activeOwner(itemId)
      : petController.activePet(itemId));
    removeFromList(itemId);
  });

  // O nome do modal vem da própria lista, sem ir ao banco.
  function askToDeactivate(itemId: number) {
    const items: CadastroItem[] = isOwnerSelected ? owners : pets;
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
              cadastros={owners}
              onDelete={askToDeactivate}
              onActive={activate.run}
            />
          ) : (
            <PetList
              saoAtivados={isAtivo == 1}
              cadastros={pets}
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
