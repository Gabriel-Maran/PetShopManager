import { useState, useEffect } from "react";
import { speciesController } from "../../controller/SpeciesController";
import { ownerController } from "../../controller/OwnerController";
import { LIMIT_ITEM_PAGE } from "../../config/consts";
import { Owner } from "../../model/Owner";
import { Species } from "../../repository/SpeciesRepository";
import type { Breed } from "../../model/Breed";
import { useError } from "../useError";
import { useSearchPage } from "../useSearchPage";
export function pegarRacasBanco(formEspecieId: number): {
  especiesList: Species[];
  racasList: Breed[];
  page: number;
  setPage: (page: number) => void;
  searchTxt: string;
  setSearchTxt: (stxt: string) => void;
  total: number;
} {
  const { showError } = useError();

  const [especiesList, setEspeciesList] = useState<Species[]>([]);
  const [racasList, setRacasList] = useState<Breed[]>([]);
  const [page, setPage] = useState<number>(0);
  const [searchTxt, setSearchTxt] = useState<string>("");
  const [total, setTotal] = useState<number>(0);

  // 1. Busca todas as espécies (executa apenas uma vez no load)
  useEffect(() => {
    speciesController
      .searchSpecies()
      .then(setEspeciesList)
      .catch(showError);
  }, []);

  // 2. Busca as raças paginadas/filtradas (executa quando muda a espécie, página ou texto)
  useEffect(() => {
    if (formEspecieId) {
      speciesController
        .searchBreed(formEspecieId, page, searchTxt)
        .then(setRacasList)
        .catch(showError);
    } else {
      setRacasList([]);
    }
  }, [formEspecieId, page, searchTxt]);

  // 3. Conta o total de raças para a paginação (executa quando muda a espécie ou texto)
  useEffect(() => {
    if (formEspecieId) {
      speciesController
        .countBreeds(formEspecieId, searchTxt)
        .then(setTotal)
        .catch(showError);
    } else {
      setTotal(0);
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
  const [page, setPage] = useState<number>(0);
  const [searchTxt, setSearchTxt] = useState<string>("");

  // A lista e o total vêm da mesma busca, e uma resposta atrasada é descartada.
  const { items: owners, total } = useSearchPage(
    () =>
      ownerController.searchOwnersPage({
        query: searchTxt,
        ativo: 1,
        page,
        limit: LIMIT_ITEM_PAGE,
      }),
    [searchTxt, page],
  );

  return {
    owners,
    page,
    setPage,
    setSearchTxt,
    total,
  };
}
