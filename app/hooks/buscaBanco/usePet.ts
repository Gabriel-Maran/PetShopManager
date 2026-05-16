import { useState, useEffect } from "react";
import { speciesController } from "../../controller/SpeciesController";
import { ownerController } from "../../controller/OwnerController";
import { LIMIT_ITEM_PAGE, ORDER } from "../../config/consts";
import { Owner } from "../../model/Owner";
import { Species } from "../../repository/SpeciesRepository";
import { useError } from "../useError";

export function pegarRacasBanco(formEspecieId: number): {
  racasList: Species[];
  especiesList: Species[];
} {
  const { showError } = useError();
  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const [especiesList, setEspeciesList] = useState<Species[]>([]);
  const [racasList, setRacasList] = useState<Species[]>([]);

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
  return { racasList, especiesList };
}

export function pegarDonosBanco(): {
  owners: Owner[];
  page: number;
  setPage: (page: number) => void;
  setSearchTxt: (stxt: string) => void;
  total: number;
} {
  const { showError } = useError();
  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const [owners, setOwners] = useState<Owner[]>([]);
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [searchTxt, setSearchTxt] = useState<string>("");
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

  return {
    owners,
    page,
    setPage,
    setSearchTxt,
    total,
  };
}
