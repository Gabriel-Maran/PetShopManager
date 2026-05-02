import { StyleSheet, View } from "react-native";
import DefaultHeader from "../components/Header/DefaultHeader";
import BarraDePesquisa from "../components/SearchBarra/BarraDePesquisa";
import { useState } from "react";
import ItemSelect from "../components/Cadastro/ItemSelect";
import { Pet } from "../../model/Pet";
import { Owner } from "../../model/Owner";
import OwnerList from "../components/Cadastro/OwnerList";
import PetList from "../components/Cadastro/PetList";

export default function Cadastros() {
  // 1. Exemplo completo (todos os campos preenchidos)
  const pets: Pet[] = [
    {
      id: 1,
      nome: "Luna",
      especie: "Gato",
      raca: "Persa",
      observacoes: "Necessita de escovação diária.",
      owner_id: 45,
      criado_em: "2024-03-15T14:20:00Z",
    },
    {
      id: 2,
      nome: "Thor",
      especie: "Cachorro",
      owner_id: 82,
    },
    {
      id: 3,
      nome: "Pingo",
      especie: "Pássaro",
      raca: "Calopsita",
      observacoes: "Canta o hino nacional.",
      owner_id: 12,
      criado_em: new Date().toISOString(),
    },
  ];
  const donos: Owner[] = [
    {
      id: 1,
      nome: "João Silva",
      telefone: "(11) 98888-7777",
      email: "joao.silva@email.com",
      endereco: "Rua das Flores, 123 - SP",
      criado_em: "2024-01-10T09:00:00Z",
    },
    {
      id: 2,
      nome: "Maria Oliveira",
      telefone: "(21) 97777-6666",
      email: "maria.oliver@provedor.com",
      // Endereço omitido (opcional)
    },
    {
      id: 3,
      nome: "Carlos Souza",
      telefone: "(31) 96666-5555",
      // Email e Endereço omitidos (opcionais)
    },
    {
      id: 4,
      nome: "Ana Costa",
      telefone: "(41) 95555-4444",
      endereco: "Av. Central, 500 - PR",
      criado_em: new Date().toISOString(),
    },
  ];

  const [isOwnerSelected, setIsOwnerSelecte] = useState(true);
  const [search, setSearch] = useState("");

  return (
    <View>
      <DefaultHeader />
      <View>
        <BarraDePesquisa
          placeHolderStr={`Pesquisar por ${isOwnerSelected ? "Dono(s)" : "Pet(s)"}`}
          setSearch={setSearch}
        />
        <View style={styles.escolhaItem}>
          <ItemSelect
            title={"Donos"}
            isThisSelected={isOwnerSelected}
            setValorSelect={setIsOwnerSelecte}
            valorSelect={true}
          />
          <ItemSelect
            title={"Pets"}
            isThisSelected={!isOwnerSelected}
            setValorSelect={setIsOwnerSelecte}
            valorSelect={false}
          />
        </View>
        {isOwnerSelected ? (
          <OwnerList items={donos} />
        ) : (
          <PetList items={pets} />
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  escolhaItem: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginTop: 15,
  },
  escolhaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: "40%",
    borderRadius: 20,
  },
  escolhaText: {
    textAlign: "center",
  },
});
