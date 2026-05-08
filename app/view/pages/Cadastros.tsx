import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useError } from "../../hooks/useError";

import { Pet } from "../../model/Pet";
import { Owner } from "../../model/Owner";

import { ownerController } from "../../controller/OwnerController";
import { petController } from "../../controller/PetController";

import { APP_BAR_HEIGHT, COLORS, ORDER, Screen } from "../../config/consts";

import BarraDePesquisa from "../components/SearchBarra/BarraDePesquisa";
import DefaultHeader from "../components/Header/DefaultHeader";
import ItemSelect from "../components/Cadastro/ItemSelect";
import PetList from "../components/Cadastro/List/PetList";
import Pagination from "../components/Cadastro/List/Pagination";
import OwnerList from "../components/Cadastro/List/OwnerList";
import ModalConfDelete from "../components/Cadastro/Botões/Delete/ModalConfDelete";

//Limite de itens por pagina
const LIMIT = 1;

export default function Cadastros() {
  const { navigate } = useScreen();
  const { showError } = useError();

  const [isOwnerSelected, setIsOwnerSelected] = useState(true); // Controla qual tela está selecionada
  const [search, setSearch] = useState(""); // Controla o que o usuário pesquisa (TODO)
  const [page, setPage] = useState(0); // Controla a pagina atual
  const [owners, setOwners] = useState<Owner[]>([]); // Controla a Lista de Owners
  const [pets, setPets] = useState<Pet[]>([]); // Controla a lista de pets
  const [total, setTotal] = useState(0); // Controla o total de itens de Pet ou Owner
  const [objSelectToDelete, setObjSelectToDelete] = useState<
    Pet | Owner | undefined
  >(undefined);

  const handleTabChange = (value: boolean) => {
    setIsOwnerSelected(value);
    setPage(0);
  };

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
      showError(e instanceof Error ? e.message : "Erro inesperado.");
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

  useEffect(() => {
    const count = isOwnerSelected
      ? ownerController.countOwners()
      : petController.countPets();

    count
      .then(setTotal)
      .catch((e) =>
        showError(e instanceof Error ? e.message : "Erro inesperado."),
      );
  }, [isOwnerSelected]);

  useEffect(() => {
    const getPagedData = isOwnerSelected
      ? //Se for Owner, pega o paged do Owner
        ownerController
          .getAllOwnersPaged(page, LIMIT, ORDER.DESC)
          .then(setOwners)
      : //Se for Pet, pega o paged do Pet
        petController.getAllPetsPaged(page, LIMIT, ORDER.DESC).then(setPets);

    getPagedData.catch((e) =>
      showError(e instanceof Error ? e.message : "Erro inesperado."),
    );
  }, [page, isOwnerSelected]);

  return (
    <>
      <ModalConfDelete
        message={`Excluindo o ${isOwnerSelected ? "dono" : "pet"} ${objSelectToDelete?.nome}`}
        onClose={() => setObjSelectToDelete(undefined)}
        onConfirmDelete={() => confirmDeletar(objSelectToDelete?.id ?? 0)}
        visible={objSelectToDelete != undefined}
      />
      <View style={styles.container}>
        <DefaultHeader />
        <BarraDePesquisa
          placeHolderStr={`Pesquisar por ${isOwnerSelected ? "Dono(s)" : "Pet(s)"}`}
          setSearch={setSearch}
        />
        <View style={styles.escolhaItem}>
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
          itemsPerPage={LIMIT}
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

      <View style={styles.ctnBtnAdd}>
        <TouchableOpacity
          style={styles.btnAdd}
          onPress={() =>
            navigate(
              isOwnerSelected ? Screen.NewOrEditOwner : Screen.NewOrEditPet,
            )
          }
        >
          <Image
            style={styles.imgAdd}
            source={require("../../assets/crud/addWhite.png")}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.THIRD_BACKGROUND,
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
    backgroundColor: COLORS.PRIMARY,
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
