// SQL das listas de serviço e de forma de pagamento, sem depender do Expo: os repositories e os testes
// executam os mesmos comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o pet e o agendamento apontam para essas listas pelo id, mas
// as telas escolhem e mostram o nome. Os comandos de gravação acham o id pelo nome com as subconsultas
// abaixo, cada uma com um `?` para o nome.
//
// Um item fora da lista (is_active = 0) é o nome que a migração manteve para o histórico: as listas do
// formulário não o oferecem, e o agendamento novo ou com a escolha trocada não o aceita.

/** Os serviços ativos em ordem alfabética, como o formulário do agendamento lista. */
export const LIST_SERVICE_TYPES_SQL =
  "SELECT id, name FROM services WHERE is_active = 1 ORDER BY name ASC";

/** As formas de pagamento ativas na ordem da carga inicial. */
export const LIST_PAYMENT_METHODS_SQL =
  "SELECT id, name FROM payment_methods WHERE is_active = 1 ORDER BY id ASC";

/**
 * O id do serviço pelo nome, ativo ou não: o pet guarda o serviço padrão que a migração manteve. Um
 * nome fora da lista dá nulo, e o NOT NULL da coluna recusa.
 */
export const SERVICE_ID_BY_NAME_SQL = "(SELECT id FROM services WHERE name = ?)";

/** O id do serviço ativo pelo nome, para o agendamento novo ou com o serviço trocado. */
export const ACTIVE_SERVICE_ID_BY_NAME_SQL =
  "(SELECT id FROM services WHERE name = ? AND is_active = 1)";

/**
 * O id da forma de pagamento ativa pelo nome. O texto vazio, "não informada", dá nulo; um nome oculto
 * também, e o CHECK do agendamento (id e nome nulos juntos) recusa.
 */
export const ACTIVE_PAYMENT_METHOD_ID_BY_NAME_SQL =
  "(SELECT id FROM payment_methods WHERE name = ? AND is_active = 1)";
