// Navegação (ARQ-3): como cada tela entra na pilha do React Navigation, as abas da barra de baixo e
// se o formulário mudou, para o voltar pedir confirmação.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  HOME_SCREEN,
  isTabScreen,
  planNavigation,
  Screen,
  TAB_SCREENS,
} from "../src/config/navigation.ts";
import { isFormDirty, isSameFieldValue } from "../src/utils/formDirty.ts";

const ALL_SCREENS = Object.values(Screen);

describe("pilha de telas", () => {
  test("o Calendário fica sozinho na pilha, e o voltar nele fecha o app", () => {
    assert.deepEqual(planNavigation(Screen.Calendar), {
      kind: "reset",
      keepHome: true,
      target: null,
    });
  });

  test("as outras abas ficam em cima do Calendário, para o voltar levar a ele", () => {
    for (const screen of [Screen.Registry, Screen.Reports, Screen.Settings]) {
      assert.deepEqual(
        planNavigation(screen),
        { kind: "reset", keepHome: true, target: screen },
        screen,
      );
    }
  });

  test("formulários e o relatório aberto entram no topo, e o voltar os tira", () => {
    for (const screen of ALL_SCREENS.filter((screen) => !isTabScreen(screen))) {
      assert.deepEqual(planNavigation(screen), { kind: "push", target: screen }, screen);
    }
  });

  test("toda tela tem um plano", () => {
    for (const screen of ALL_SCREENS) assert.ok(planNavigation(screen), screen);
  });
});

describe("abas da barra de baixo", () => {
  test("são as quatro telas principais, na ordem da barra, a começar pela inicial", () => {
    assert.deepEqual(
      TAB_SCREENS.map((tab) => tab.screen),
      [Screen.Calendar, Screen.Registry, Screen.Reports, Screen.Settings],
    );
    assert.equal(TAB_SCREENS[0].screen, HOME_SCREEN);
  });

  test("cada aba tem nome e ícone, sem tela nem ícone repetido", () => {
    for (const tab of TAB_SCREENS) {
      assert.ok(tab.title.trim(), tab.screen);
      assert.ok(tab.icon, tab.screen);
    }
    assert.equal(new Set(TAB_SCREENS.map((tab) => tab.screen)).size, TAB_SCREENS.length);
    assert.equal(new Set(TAB_SCREENS.map((tab) => tab.icon)).size, TAB_SCREENS.length);
  });

  test("a barra aparece só nas abas, e não nos formulários nem no relatório aberto", () => {
    for (const screen of ALL_SCREENS) {
      const isTab = TAB_SCREENS.some((tab) => tab.screen === screen);
      assert.equal(isTabScreen(screen), isTab, screen);
    }
    assert.equal(isTabScreen(Screen.NewOrEditPet), false);
    assert.equal(isTabScreen(Screen.ReportView), false);
  });
});

describe("formulário mudado (isFormDirty)", () => {
  const newOwner = { name: "", phone: "", email: "", address: "" };
  const loadedPet = {
    name: "Rex",
    species_id: 1,
    owner_id: 3,
    owner_name: "",
    breed_name: "Vira-lata",
    rescheduleActive: true,
    notes: null,
  };
  const DERIVED_FIELDS = ["owner_name", "breed_name"];

  test("sem mexer, o cadastro novo e a edição carregada não mudaram", () => {
    assert.equal(isFormDirty(newOwner, { ...newOwner }), false);
    assert.equal(isFormDirty(loadedPet, { ...loadedPet }), false);
  });

  test("um campo digitado ou trocado conta como mudança", () => {
    assert.equal(isFormDirty(newOwner, { ...newOwner, name: "Ana" }), true);
    assert.equal(isFormDirty(loadedPet, { ...loadedPet, species_id: 2 }), true);
    assert.equal(isFormDirty(loadedPet, { ...loadedPet, rescheduleActive: false }), true);
  });

  test("na edição compara com o estado carregado, e não com o vazio", () => {
    const emptyPet = { ...loadedPet, name: "", species_id: 0, owner_id: 0 };
    assert.equal(isFormDirty(loadedPet, { ...loadedPet }), false);
    assert.equal(isFormDirty(loadedPet, emptyPet), true);
  });

  test("editar e desfazer volta a não ter mudança", () => {
    const typed = { ...loadedPet, name: "Rexx" };
    const undone = { ...typed, name: "Rex" };
    assert.equal(isFormDirty(loadedPet, typed), true);
    assert.equal(isFormDirty(loadedPet, undone), false);
  });

  test("campo vazio continua vazio, seja null, undefined ou texto vazio", () => {
    assert.equal(isFormDirty(loadedPet, { ...loadedPet, notes: "" }), false);
    assert.equal(isFormDirty(loadedPet, { ...loadedPet, notes: undefined }), false);
    assert.equal(isFormDirty({ pacote: undefined }, { pacote: null }), false);
  });

  test("os campos derivados, como os nomes buscados pelo id, não contam como mudança", () => {
    const afterLoad = { ...loadedPet, owner_name: "Ana", breed_name: "" };
    assert.equal(isFormDirty(loadedPet, afterLoad), true);
    assert.equal(isFormDirty(loadedPet, afterLoad, DERIVED_FIELDS), false);
    assert.equal(isFormDirty(loadedPet, { ...afterLoad, owner_id: 4 }, DERIVED_FIELDS), true);
  });

  test("um campo que só existe de um lado conta como mudança, se tiver valor", () => {
    assert.equal(isFormDirty({ name: "Rex" }, { name: "Rex", extra: "x" }), true);
    assert.equal(isFormDirty({ name: "Rex" }, { name: "Rex", extra: "" }), false);
  });

  test("formulário sem campos não muda", () => {
    assert.equal(isFormDirty({}, {}), false);
  });
});

describe("valor de campo igual (isSameFieldValue)", () => {
  test("null, undefined e texto vazio são o mesmo vazio", () => {
    for (const a of [null, undefined, ""]) {
      for (const b of [null, undefined, ""]) {
        assert.equal(isSameFieldValue(a, b), true, `${a} e ${b}`);
      }
    }
  });

  test("zero, false e espaço não são vazios", () => {
    assert.equal(isSameFieldValue(0, ""), false);
    assert.equal(isSameFieldValue(false, null), false);
    assert.equal(isSameFieldValue(" ", ""), false);
  });

  test("compara pelo valor, sem converter o tipo", () => {
    assert.equal(isSameFieldValue("1", 1), false);
    assert.equal(isSameFieldValue(1, 1), true);
    assert.equal(isSameFieldValue(Number.NaN, Number.NaN), true);
  });
});
