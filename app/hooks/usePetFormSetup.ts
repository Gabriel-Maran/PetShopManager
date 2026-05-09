import { useState, useEffect } from "react";
import { speciesController } from "../controller/SpeciesController";
import { ownerController } from "../controller/OwnerController";
import { LIMIT_ITEM_PAGE, ORDER } from "../config/consts";
import { Owner } from "../model/Owner";
import { useError } from "./useError";

export function usePetFormSetup(formEspecieId: number) {
  const { showError } = useError();

  const [especiesList, setEspeciesList] = useState<
    { id: number; nome: string }[]
  >([]);
  const [racasList, setRacasList] = useState<{ id: number; nome: string }[]>(
    [],
  );
  const [owners, setOwners] = useState<Owner[] | undefined | null>();
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTxt, setSearchTxt] = useState("");

  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  useEffect(() => {
    try {
      ownerController
        .searchOwnersByNamePaged(searchTxt, page, LIMIT_ITEM_PAGE, ORDER.DESC)
        .then(setOwners)
        .catch(handleError);
    } catch (e) {
      handleError(e);
    }
  }, [searchTxt, page]);

  useEffect(() => {
    ownerController.countOwners().then(setTotal).catch(handleError);
  }, []);

  useEffect(() => {
    speciesController.searchSpecies().then(setEspeciesList).catch(handleError);
  }, []);

  useEffect(() => {
    if (formEspecieId) {
      speciesController
        .searchBreedsBySpecies(formEspecieId)
        .then(setRacasList)
        .catch(handleError);
    } else {
      setRacasList([]);
    }
  }, [formEspecieId]);

  return {
    especiesList,
    racasList,
    owners,
    page,
    setPage,
    setSearchTxt,
    total,
  };
}
