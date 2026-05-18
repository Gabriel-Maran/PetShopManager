import { useState, useEffect } from "react";
import { speciesController } from "../../controller/SpeciesController";
import { ownerController } from "../../controller/OwnerController";
import { LIMIT_ITEM_PAGE, ORDER } from "../../config/consts";
import { Owner } from "../../model/Owner";
import { Species } from "../../repository/SpeciesRepository";
import { useError } from "../useError";
export function pegarRacasBanco(formEspecieId: number): {
  especiesList: Species[];
  racasList: Species[];
  page: number;
  setPage: (page: number) => void;
  searchTxt: string;
  setSearchTxt: (stxt: string) => void;
  total: number;
} {
  const { showError } = useError();
  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const [especiesList, setEspeciesList] = useState<Species[]>([]);
  const [racasList, setRacasList] = useState<Species[]>([]);
  const [page, setPage] = useState<number>(0);
  const [searchTxt, setSearchTxt] = useState<string>("");
  const [total, setTotal] = useState<number>(0);

  // 1. Busca todas as espécies (executa apenas uma vez no load)
  useEffect(() => {
    try {
      speciesController
        .searchSpecies()
        .then(setEspeciesList)
        .catch(handleError);
    } catch (e) {
      handleError(e);
    }
  }, []);

  // 2. Busca as raças paginadas/filtradas (executa quando muda a espécie, página ou texto)
  useEffect(() => {
    try {
      if (formEspecieId) {
        speciesController
          .searchBreed(formEspecieId, page, searchTxt)
          .then(setRacasList)
          .catch(handleError);
      } else {
        setRacasList([]);
      }
    } catch (e) {
      handleError(e);
    }
  }, [formEspecieId, page, searchTxt]);

  // 3. Conta o total de raças para a paginação (executa quando muda a espécie ou texto)
  useEffect(() => {
    try {
      if (formEspecieId) {
        speciesController
          .countBreeds(formEspecieId, searchTxt)
          .then(setTotal)
          .catch(handleError);
      } else {
        setTotal(0);
      }
    } catch (e) {
      handleError(e);
    }
  }, [formEspecieId, searchTxt]);

  // 4. Reseta a página para 0 sempre que a espécie selecionada ou o texto de busca mudarem
  useEffect(() => {
    setPage(0);
  }, [formEspecieId, searchTxt]);

  return {
    especiesList,
    racasList,
    page,
    setPage,
    searchTxt,
    setSearchTxt,
    total,
  };
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
    ownerController.countOwners(searchTxt).then(setTotal).catch(handleError);
  }, [searchTxt]);

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
