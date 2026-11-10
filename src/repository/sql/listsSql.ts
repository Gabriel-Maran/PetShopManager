// SQL das listas de serviço e de forma de pagamento, sem depender do Expo: os repositories e os testes
// executam os mesmos comandos.
//
// Desde a versão 6 do esquema (DADOS-4), o pet e o agendamento apontam para essas listas pelo id, mas
// as telas escolhem e mostram o nome. Os comandos de gravação acham o id pelo nome com as subconsultas
// abaixo, cada uma com um `?` para o nome.

/** Os serviços em ordem alfabética, como o formulário do agendamento lista. */
export const LIST_SERVICE_TYPES_SQL = "SELECT id, servico FROM service_type ORDER BY servico ASC";

/** As formas de pagamento na ordem da carga inicial. */
export const LIST_PAYMENT_METHODS_SQL = "SELECT id, tipo_pgto FROM payment_methods ORDER BY id ASC";

/** O id do serviço pelo nome. Um nome fora da lista dá nulo, e o NOT NULL da coluna recusa. */
export const SERVICE_ID_BY_NAME_SQL = "(SELECT id FROM service_type WHERE servico = ?)";

/** O id da forma de pagamento pelo nome. O texto vazio, "não informada", dá nulo. */
export const PAYMENT_METHOD_ID_BY_NAME_SQL = "(SELECT id FROM payment_methods WHERE tipo_pgto = ?)";
