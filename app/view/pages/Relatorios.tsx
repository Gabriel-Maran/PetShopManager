import { Text, View, Button } from "react-native";
import DefaultHeader from "../components/Header/DefaultHeader";
import ModalSelectList from "../components/Cadastro/Modal/ModalSelectList";
import { useEffect, useState } from "react";
import Pagination from "../components/Cadastro/List/Pagination";
import { ownerController } from "../../controller/OwnerController";
import { petController } from "../../controller/PetController";
import { useError } from "../../hooks/useError";
import { Owner } from "../../model/Owner";
import { Pet } from "../../model/Pet";
import { LIMIT_ITEM_PAGE, ORDER } from "../../config/consts";

export default function Relatorios() {
  const [page, setPage] = useState(0); // Controla a pagina atual
  const [total, setTotal] = useState(0); // Controla o total de itens de Pet ou Owner
  const [isOpen, setIsOpen] = useState(false);
  const [searchTxt, setSearchTxt] = useState("");
  const [isOwner, setIsOwner] = useState(true);
  const [owners, setOwners] = useState<Owner[] | undefined | null>();
  const [pets, setPets] = useState<Pet[] | undefined | null>();
  const { showError } = useError();

  useEffect(() => {
    const count = isOwner
      ? ownerController.countOwners()
      : petController.countPets();

    count
      .then(setTotal)
      .catch((e) =>
        showError(e instanceof Error ? e.message : "Erro inesperado."),
      );
  }, [isOwner]);

  useEffect(() => {
    const getPagedData = isOwner
      ? //Se for Owner, pega o paged do Owner
        ownerController
          .getAllOwnersPaged(page, LIMIT_ITEM_PAGE, ORDER.DESC)
          .then(setOwners)
      : //Se for Pet, pega o paged do Pet
        petController
          .getAllPetsPaged(page, LIMIT_ITEM_PAGE, ORDER.DESC)
          .then(setPets);

    getPagedData.catch((e) =>
      showError(e instanceof Error ? e.message : "Erro inesperado."),
    );
  }, [page, isOwner]);

  return (
    <View>
      <DefaultHeader />
      <Button title="ABRIR MODAL" onPress={() => setIsOpen(true)} />
      <ModalSelectList
        setSearch={(searchTxt: string) => setSearchTxt(searchTxt)}
        isOpen={isOpen}
        isOwner={isOwner}
        onClose={() => setIsOpen(false)}
        onSelect={(item) => console.log("Item selecionado " + item.nome)}
        items={isOwner ? owners : pets}
        page={page}
        total={total}
        setPage={setPage}
      />
      <View></View>
    </View>
  );
}
