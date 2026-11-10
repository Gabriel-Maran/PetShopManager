// As configurações do app, como o tema (VALID-1). Sem depender do Expo, para os testes rodarem no
// Node, que exige a extensão .ts nos imports.
import * as z from "zod";
import { flag, id } from "./fields.ts";

/** A troca de uma configuração: qual e se fica ligada. A tela não digita o id, então ele não tem mensagem. */
export const configUpdateSchema = z.object({
  id: id(),
  is_ativo: flag("Configuração"),
});
