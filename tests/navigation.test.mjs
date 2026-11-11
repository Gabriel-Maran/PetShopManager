// Botão voltar (BUG-8): para onde o voltar leva a partir de cada tela, e o caminho único que o botão
// da tela e o do Android seguem, com a guarda que pede confirmação nos formulários mudados e recolhe
// a agenda em tela cheia. Também as abas da barra de baixo.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  backRouteOf,
  HOME_SCREEN,
  isTabScreen,
  Screen,
  TAB_SCREENS,
} from "../src/config/navigation.ts";
import { ScreenController } from "../src/controller/ScreenController.ts";
import { isFormDirty, isSameFieldValue } from "../src/utils/formDirty.ts";

const ALL_SCREENS = Object.values(Screen);

describe("mapa do voltar", () => {
  test("só o Calendário, a tela inicial, fecha o app", () => {
    assert.equal(HOME_SCREEN, Screen.Calendar);
    assert.equal(backRouteOf(Screen.Calendar), null);
    for (const screen of ALL_SCREENS.filter((s) => s !== HOME_SCREEN)) {
      assert.ok(backRouteOf(screen), screen);
    }
  });

  test("as abas principais voltam para o Calendário", () => {
    for (const { screen } of TAB_SCREENS.filter((tab) => tab.screen !== HOME_SCREEN)) {
      assert.deepEqual(backRouteOf(screen), { screen: Screen.Calendar }, screen);
    }
  });

  test("os formulários de dono e pet voltam para a aba deles em Cadastros", () => {
    assert.deepEqual(backRouteOf(Screen.NewOrEditOwner), {
      screen: Screen.Registry,
      params: { type: "OWNER", mode: "view" },
    });
    assert.deepEqual(backRouteOf(Screen.NewOrEditPet), {
      screen: Screen.Registry,
      params: { type: "PET", mode: "view" },
    });
  });

  test("o agendamento volta para o Calendário, e o relatório, para a lista de relatórios", () => {
    assert.deepEqual(backRouteOf(Screen.NewOrEditAppointment), { screen: Screen.Calendar });
    assert.deepEqual(backRouteOf(Screen.ReportView), { screen: Screen.Reports });
  });

  test("de qualquer tela, voltando sem parar, chega ao Calendário sem andar em círculo", () => {
    for (const start of ALL_SCREENS) {
      const visited = new Set();
      let screen = start;
      while (screen !== HOME_SCREEN) {
        assert.ok(!visited.has(screen), `o voltar anda em círculo a partir de ${start}`);
        visited.add(screen);
        screen = backRouteOf(screen).screen;
      }
    }
  });
});

describe("voltar pelo ScreenController", () => {
  let controller;
  let visits;

  beforeEach(() => {
    controller = new ScreenController();
    visits = [];
    controller.subscribe((screen, params) => visits.push({ screen, params }));
  });

  test("o app abre no Calendário", () => {
    assert.equal(controller.getCurrentScreen(), HOME_SCREEN);
  });

  test("volta para a tela do mapa, com os parâmetros dela no lugar dos da tela que saiu", () => {
    controller.setCurrentScreen(Screen.NewOrEditPet, { type: "PET", mode: "edit", pet: { id: 7 } });

    assert.equal(controller.requestBack(), true);
    assert.equal(controller.getCurrentScreen(), Screen.Registry);
    assert.deepEqual(controller.getCurrentParams(), { type: "PET", mode: "view" });
  });

  test("no Calendário devolve false, para o Android fechar o app, e não navega", () => {
    assert.equal(controller.requestBack(), false);
    assert.equal(controller.goBack(), false);
    assert.deepEqual(visits, []);
  });

  test("com a guarda, o voltar pede a confirmação e fica na tela", () => {
    controller.setCurrentScreen(Screen.NewOrEditAppointment);
    let confirmations = 0;
    controller.setBackGuard(() => confirmations++);

    assert.equal(controller.requestBack(), true);
    assert.equal(confirmations, 1);
    assert.equal(controller.getCurrentScreen(), Screen.NewOrEditAppointment);
  });

  test("depois da confirmação, o goBack sai mesmo com a guarda posta", () => {
    controller.setCurrentScreen(Screen.NewOrEditOwner);
    controller.setBackGuard(() => assert.fail("o goBack não passa pela guarda"));

    assert.equal(controller.goBack(), true);
    assert.equal(controller.getCurrentScreen(), Screen.Registry);
  });

  test("sem a guarda, o voltar volta direto", () => {
    controller.setCurrentScreen(Screen.ReportView);
    const removeGuard = controller.setBackGuard(() => assert.fail("a guarda já foi tirada"));
    removeGuard();

    assert.equal(controller.requestBack(), true);
    assert.equal(controller.getCurrentScreen(), Screen.Reports);
  });

  test("tirar uma guarda antiga não apaga a guarda nova", () => {
    controller.setCurrentScreen(Screen.NewOrEditPet);
    const removeOld = controller.setBackGuard(() => assert.fail("a guarda antiga foi trocada"));
    let confirmations = 0;
    controller.setBackGuard(() => confirmations++);
    removeOld();

    controller.requestBack();
    assert.equal(confirmations, 1);
    assert.equal(controller.getCurrentScreen(), Screen.NewOrEditPet);
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

describe("ordem do voltar", () => {
  let controller;

  beforeEach(() => {
    controller = new ScreenController();
  });

  test("na Home com a agenda em tela cheia, o voltar recolhe a agenda e não fecha o app", () => {
    let collapsed = 0;
    const removeGuard = controller.setBackGuard(() => {
      collapsed++;
      removeGuard();
    });

    assert.equal(controller.requestBack(), true);
    assert.equal(collapsed, 1);
    assert.equal(controller.getCurrentScreen(), HOME_SCREEN);

    // Com a agenda recolhida a guarda sai, e o voltar seguinte fecha o app.
    assert.equal(controller.requestBack(), false);
    assert.equal(collapsed, 1);
  });

  test("formulário sem mudança não põe guarda: o voltar sai direto", () => {
    controller.setCurrentScreen(Screen.NewOrEditOwner, { type: "OWNER", mode: "edit" });

    assert.equal(controller.requestBack(), true);
    assert.equal(controller.getCurrentScreen(), Screen.Registry);
  });

  test("formulário mudado e depois desfeito tira a guarda e volta direto", () => {
    controller.setCurrentScreen(Screen.NewOrEditAppointment);
    const removeGuard = controller.setBackGuard(() => assert.fail("o formulário já foi desfeito"));
    removeGuard();

    assert.equal(controller.requestBack(), true);
    assert.equal(controller.getCurrentScreen(), Screen.Calendar);
  });
});
