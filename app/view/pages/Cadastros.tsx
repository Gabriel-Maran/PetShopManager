import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useError } from "../../hooks/useError";

import { Pet, PetWithSpecieAndRace } from "../../model/Pet";
import { Owner } from "../../model/Owner";

import { ownerController } from "../../controller/OwnerController";
import { petController } from "../../controller/PetController";

import {
  APP_BAR_HEIGHT,
  LIMIT_ITEM_PAGE,
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

export default function Cadastros() {
  const { navigate, params } = useScreen();
  const { showError } = useError();

  const s = useThemedStyles(styles);

  const [isOwnerSelected, setIsOwnerSelected] = useState(params !== "PETS");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pets, setPets] = useState<PetWithSpecieAndRace[]>([]);
  const [total, setTotal] = useState(0);
  const [objSelectToDelete, setObjSelectToDelete] = useState<
    Pet | Owner | undefined
  >();
  const [isAtivo, setIsAtivo] = useState(1);

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const handleTabChange = (value: boolean) => {
    setIsOwnerSelected(value);
    setSearch("");
    setPage(0);
  };

  // Contagem total — recalcula ao trocar de aba
  useEffect(() => {
    const count = isOwnerSelected
      ? ownerController.countOwners()
      : petController.countPets();
    count.then(setTotal).catch(handleError);
  }, [isOwnerSelected]);

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
    fetch.catch(handleError);
  }, [search, page, isOwnerSelected, isAtivo]);

  function confirmDeletar(itemId: number) {
    try {
      if (isOwnerSelected) {
        ownerController.deleteOwner(itemId);
        setOwners((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        petController.deletePet(itemId);
        setPets((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (e) {
      handleError(e);
    }
    setObjSelectToDelete(undefined);
  }

  async function handleDeleteSelected(itemId: number) {
    if (isOwnerSelected) {
      const owner = await ownerController.getOwnerById(itemId);
      setObjSelectToDelete(owner);
      return;
    }
    const pet = await petController.getPetById(itemId);
    setObjSelectToDelete(pet);
  }

  return (
    <>
      <ModalConfDelete
        message={`Excluindo o ${isOwnerSelected ? "dono" : "pet"} ${objSelectToDelete?.nome}`}
        onClose={() => setObjSelectToDelete(undefined)}
        onConfirmDelete={() => confirmDeletar(objSelectToDelete?.id ?? 0)}
        visible={objSelectToDelete != undefined}
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
            <OwnerList cadastros={owners} onDelete={handleDeleteSelected} />
          ) : (
            <PetList cadastros={pets} onDelete={handleDeleteSelected} />
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
