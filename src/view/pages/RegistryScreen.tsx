import { Image, StyleSheet, View } from "react-native";
import { useState, useEffect } from "react";

import { useScreen } from "../../hooks/useScreen";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useSearchPage } from "../../hooks/useSearchPage";

import { PetWithSpeciesBreedAndOwner } from "../../model/Pet";
import { Owner } from "../../model/Owner";
import type { NameSearch } from "../../model/Search";

import { ownerController } from "../../controller/OwnerController";
import { petController } from "../../controller/PetController";

import { APP_BAR_HEIGHT, LIMIT_ITEM_PAGE, RegistryParams, Screen } from "../../config/consts";

import SearchBar from "../components/searchBar/SearchBar";
import DefaultHeader from "../components/header/DefaultHeader";
import ItemSelect from "../components/registry/ItemSelect";
import PetList from "../components/registry/list/PetList";
import Pagination from "../components/registry/list/Pagination";
import OwnerList from "../components/registry/list/OwnerList";
import DeactivateConfirmModal from "../components/registry/buttons/DeactivateConfirmModal";
import IconButton from "../components/accessibility/IconButton";
import { ThemeColors, useThemedStyles } from "../theme/ThemeProvider";
import { A11Y_LABELS } from "../../globals/accessibilityLabels";
import { SPACING } from "../theme/tokens";

type RegistryItem = Owner | PetWithSpeciesBreedAndOwner;

const ADD_BUTTON_SIZE = 65;

export default function RegistryScreen() {
  const { navigate, params } = useScreen<RegistryParams>();

  const s = useThemedStyles(styles);

  const [isOwnerSelected, setIsOwnerSelected] = useState(params?.type !== "PET");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [itemToDeactivate, setItemToDeactivate] = useState<RegistryItem | undefined>();
  const [showActive, setShowActive] = useState(1);

  const handleTabChange = (value: boolean) => {
    setIsOwnerSelected(value);
    setSearch("");
    setPage(0);
  };

  const nameSearch: NameSearch = {
    query: search,
    active: showActive,
    page,
    limit: LIMIT_ITEM_PAGE,
  };
  const searchDeps = [search, page, showActive];

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
  }, [total, page]);

  // A lista só muda depois que o banco confirma, e a busca de novo traz a página e o total certos.
  // Uma falha aparece no modal de erro, e o item fica.
  const deactivate = useAsyncAction(async (itemId: number) => {
    await (isOwnerSelected
      ? ownerController.deactivateOwner(itemId)
      : petController.deactivatePet(itemId));
    reload();
  });

  const activate = useAsyncAction(async (itemId: number) => {
    await (isOwnerSelected
      ? ownerController.activateOwner(itemId)
      : petController.activatePet(itemId));
    reload();
  });

  // O nome do modal vem da própria lista, sem ir ao banco.
  function askToDeactivate(itemId: number) {
    const items: RegistryItem[] = isOwnerSelected ? owners.items : pets.items;
    setItemToDeactivate(items.find((item) => item.id === itemId));
  }

  function confirmDeactivate() {
    const itemId = itemToDeactivate?.id;
    setItemToDeactivate(undefined);
    if (itemId !== undefined) deactivate.run(itemId);
  }

  return (
    <>
      <DeactivateConfirmModal
        message={`Desativando o ${isOwnerSelected ? "dono" : "pet"} ${itemToDeactivate?.name}`}
        onClose={() => setItemToDeactivate(undefined)}
        onConfirm={confirmDeactivate}
        visible={itemToDeactivate !== undefined}
      />

      <View style={s.container}>
        <DefaultHeader />

        <SearchBar
          placeholderText={`Pesquisar por ${isOwnerSelected ? "Dono(s)" : "Pet(s)"}`}
          setSearch={(txt) => {
            setPage(0); // Volta pra página 1 a cada nova busca
            setSearch(txt);
          }}
          hasFilter={true}
          onStatusFilterChange={(item: number) => {
            setPage(0);
            setShowActive(item);
          }}
          statusFilter={showActive ? "active" : "inactive"}
        />

        <View style={s.choiceItem} accessibilityRole="tablist">
          <ItemSelect
            title="Donos"
            isThisSelected={isOwnerSelected}
            setSelectValue={handleTabChange}
            selectValue={true}
          />
          <ItemSelect
            title="Pets"
            isThisSelected={!isOwnerSelected}
            setSelectValue={handleTabChange}
            selectValue={false}
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
              areActive={showActive === 1}
              records={owners.items}
              onDeactivate={askToDeactivate}
              onActivate={activate.run}
            />
          ) : (
            <PetList
              areActive={showActive === 1}
              records={pets.items}
              onDeactivate={askToDeactivate}
              onActivate={activate.run}
            />
          )}
        </View>
      </View>

      <View style={s.ctnBtnAdd}>
        <IconButton
          label={isOwnerSelected ? A11Y_LABELS.registry.addOwner : A11Y_LABELS.registry.addPet}
          width={ADD_BUTTON_SIZE}
          style={s.btnAdd}
          onPress={() => navigate(isOwnerSelected ? Screen.NewOrEditOwner : Screen.NewOrEditPet)}
        >
          <Image style={s.imgAdd} source={require("../../assets/crud/addWhite.png")} />
        </IconButton>
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
    choiceItem: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      width: "100%",
      marginTop: SPACING[15],
    },
    ctnBtnAdd: {
      position: "absolute",
      bottom: APP_BAR_HEIGHT + 25,
      right: 25,
    },
    btnAdd: {
      backgroundColor: colors.PRIMARY,
      borderRadius: ADD_BUTTON_SIZE / 2,
      width: ADD_BUTTON_SIZE,
      height: ADD_BUTTON_SIZE,
      justifyContent: "center",
      alignItems: "center",
    },
    imgAdd: {
      width: 40,
      height: 40,
    },
  });
