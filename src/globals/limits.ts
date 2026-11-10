// Limites de entrada do app, num lugar só: a tela usa no campo, e o schema de src/validation confere
// de novo antes de gravar (VALID-1).

/** O tamanho máximo do texto de uma busca por nome. */
export const MAX_SEARCH_LENGTH = 100;

/** O nome do dono. */
export const MAX_OWNER_NAME_LENGTH = 100;

/** O telefone com a máscara da tela, como "(45) 99999-9999". */
export const MAX_PHONE_LENGTH = 15;

/** O e-mail, no limite do padrão da internet (RFC 5321). */
export const MAX_EMAIL_LENGTH = 254;

/** O endereço do dono. */
export const MAX_ADDRESS_LENGTH = 120;

/** O nome do pet. */
export const MAX_PET_NAME_LENGTH = 25;

/** A observação do pet e a do agendamento. */
export const MAX_NOTES_LENGTH = 250;

/** O nome da raça: pelo menos 2 caracteres e no máximo 50. */
export const MIN_BREED_NAME_LENGTH = 2;
export const MAX_BREED_NAME_LENGTH = 50;

/** O nome de um item escolhido numa lista do app, como o serviço e o tipo de pagamento. */
export const MAX_LIST_ITEM_LENGTH = 50;

/** O horário digitado com a máscara, "HH:MM". */
export const MAX_TIME_LENGTH = 5;

/** O valor digitado com a máscara de dinheiro, como "1250,00". */
export const MAX_MONEY_INPUT_LENGTH = 7;
