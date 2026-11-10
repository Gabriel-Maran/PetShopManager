// Botão voltar (BUG-8): para onde o voltar leva a partir de cada tela, e o caminho único que o botão
// da tela e o do Android seguem, com a guarda que pede confirmação nos formulários.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { backRouteOf, HOME_SCREEN, Screen } from "../app/config/navigation.ts";
import { ScreenController } from "../app/controller/ScreenController.ts";

const ALL_SCREENS = Object.values(Screen);

describe("mapa do voltar", () => {
  test("só o Calendário, a tela inicial, fecha o app", () => {
    assert.equal(HOME_SCREEN, Screen.Calendario);
    assert.equal(backRouteOf(Screen.Calendario), null);
    for (const screen of ALL_SCREENS.filter((s) => s !== HOME_SCREEN)) {
      assert.ok(backRouteOf(screen), screen);
    }
  });

  test("as abas principais voltam para o Calendário", () => {
    for (const tab of [Screen.Cadastros, Screen.Relatorios, Screen.Configuracoes]) {
      assert.deepEqual(backRouteOf(tab), { screen: Screen.Calendario }, tab);
    }
  });

  test("os formulários de dono e pet voltam para a aba deles em Cadastros", () => {
    assert.deepEqual(backRouteOf(Screen.NewOrEditOwner), {
      screen: Screen.Cadastros,
      params: { type: "DONO", mode: "view" },
    });
    assert.deepEqual(backRouteOf(Screen.NewOrEditPet), {
      screen: Screen.Cadastros,
      params: { type: "PET", mode: "view" },
    });
  });

  test("o agendamento volta para o Calendário, e o relatório, para a lista de relatórios", () => {
    assert.deepEqual(backRouteOf(Screen.NewOrEditAppointment), { screen: Screen.Calendario });
    assert.deepEqual(backRouteOf(Screen.RelatorioView), { screen: Screen.Relatorios });
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
    assert.equal(controller.getCurrentScreen(), Screen.Cadastros);
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
    assert.equal(controller.getCurrentScreen(), Screen.Cadastros);
  });

  test("sem a guarda, o voltar volta direto", () => {
    controller.setCurrentScreen(Screen.RelatorioView);
    const removeGuard = controller.setBackGuard(() => assert.fail("a guarda já foi tirada"));
    removeGuard();

    assert.equal(controller.requestBack(), true);
    assert.equal(controller.getCurrentScreen(), Screen.Relatorios);
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
