import {
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EspeciesAtendidasLabel } from "../../../../config/consts";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";
import InputInfo from "../../Cadastro/InputInfo";
import InputSelect from "../../InputSelect";
import SelectionField from "../../Cadastro/SelectionField";
import { Pet } from "../../../../model/Pet";
import { useEffect } from "react";
import { petController } from "../../../../controller/PetController";
import { ownerController } from "../../../../controller/OwnerController";
import { reaceRepository } from "../../../../repository/RaceRepository";

interface AbaInfoPetProps {
  isEditavel?: boolean;
  isNewPet: boolean;
  form: {
    nome: string;
    especie: number;
    dono_id: number;
    dono_nome: string;
    raca: number;
    raca_nome: string;
    observacoes: string;
    porte: string;
  };
  updateField: (field: string, value: any) => void;
  abrirModal: (config: {
    titulo: string;
    itemIcon?: ImageSourcePropType;
    lista: any[];
    aoSelecionar: (item: any) => void;
  }) => void;
  racasList: any[];
  especiesList: any[];
  portesList: { id: string; nome: string }[];
  petToEdit?: Pet;
  salvarPet: () => void;
}

export default function AbaInfoPet({
  isEditavel = true,
  isNewPet,
  form,
  updateField,
  abrirModal,
  racasList,
  especiesList,
  portesList,
  petToEdit,
  salvarPet,
}: AbaInfoPetProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  useEffect(() => {
    if (!isNewPet && form.dono_id) {
      ownerController
        .getOwnerById(form.dono_id)
        .then((resultado) => {
          if (resultado?.nome) {
            updateField("dono_nome", resultado.nome);
          }
        })
        .catch((error) => console.error("Erro ao buscar dono:", error));
    }

    if (!isNewPet && form.raca) {
      reaceRepository
        .findRaceById(form.raca)
        .then((resultado) => {
          if (resultado?.nome_raca) {
            updateField("raca_nome", resultado.nome_raca);
          }
        })
        .catch((error) => console.error("Erro ao buscar raça:", error));
    }
  }, [isNewPet]);

  useEffect(() => {
    updateField("raca_nome", null);
  }, [form.especie]);

  return (
    <>
      <View style={s.inputs}>
        <InputInfo
          image={require("../../../../assets/animais/iconNome.png")}
          item={form.nome}
          setItem={(v) => updateField("nome", v)}
          placeHolder="Digite o nome..."
          titleName="Nome Completo"
          variasLinhas={false}
          hasBorderBottom={true}
          digitavel={isEditavel}
        />

        <SelectionField
          image={require("../../../../assets/animais/iconDono.png")}
          titleName="Dono"
          selectedReg={form.dono_nome}
          buttonText={form.dono_nome ? "Trocar dono" : "Selecionar dono"}
          hasBorderBottom={true}
          onPress={() =>
            abrirModal({
              titulo: "Selecionar Dono",
              itemIcon: require("../../../../assets/animais/iconDono.png"),
              lista: [],
              aoSelecionar: (item) => {
                updateField("dono_id", item.id);
                updateField("dono_nome", item.nome);
              },
            })
          }
          onClear={() => {
            updateField("dono_id", 0);
            updateField("dono_nome", "");
          }}
          goEdit={true}
          isEditavel={isEditavel}
        />

        <InputSelect
          titleName="Espécie"
          image={require("../../../../assets/animais/iconEspecie.png")}
          placeholder="Selecione a espécie..."
          itens={especiesList}
          itemSelected={especiesList.find((e) => e.id === form.especie)}
          labelExtractor={(item) =>
            EspeciesAtendidasLabel[
              item.nome as keyof typeof EspeciesAtendidasLabel
            ]
          }
          onChange={(item) => updateField("especie", item.id)}
          renderItem={(item) => (
            <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
              {
                EspeciesAtendidasLabel[
                  item.nome as keyof typeof EspeciesAtendidasLabel
                ]
              }
            </Text>
          )}
          hasBorderBottom={true}
          isEditavel={isEditavel}
        />

        <SelectionField
          image={require("../../../../assets/animais/iconRaca.png")}
          titleName="Raça"
          selectedReg={form.raca_nome}
          buttonText={form.raca_nome ? "Trocar raça" : "Selecionar raça"}
          hasBorderBottom={true}
          onPress={() =>
            abrirModal({
              titulo: "Selecionar Raça",
              itemIcon: require("../../../../assets/animais/iconPata.png"),
              lista: racasList || [],
              aoSelecionar: (item) => {
                updateField("raca", item.id);
                updateField("raca_nome", item.nome);
              },
            })
          }
          onClear={() => {
            updateField("raca", 0);
            updateField("raca_nome", "");
          }}
          goEdit={true}
          isEditavel={isEditavel}
        />

        <InputSelect
          titleName="Porte"
          image={require("../../../../assets/animais/iconPorte.png")}
          placeholder="Selecione o Porte do animal"
          itens={portesList}
          itemSelected={portesList.find((e) => e.id === form.porte)}
          labelExtractor={(item) => item.nome}
          onChange={(item) => updateField("porte", item.nome)}
          renderItem={(item) => (
            <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
              {item.nome}
            </Text>
          )}
          hasBorderBottom={true}
          isEditavel={isEditavel}
        />

        <InputInfo
          image={require("../../../../assets/nav_bar/artigo.png")}
          item={form.observacoes}
          setItem={(v) => updateField("observacoes", v)}
          placeHolder="Uma observação adicional..."
          titleName="Observações"
          variasLinhas={true}
          digitavel={isEditavel}
          hasBorderBottom={false}
        />
      </View>
    </>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    inputs: {
      width: "100%",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
  });
