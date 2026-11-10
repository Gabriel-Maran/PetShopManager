// Se o formulário mudou desde que abriu, para o voltar só pedir confirmação quando há o que perder.
// Sem depender do React Native, para os testes rodarem no Node.

/** Um campo vazio pode estar como null, undefined ou "", conforme de onde veio o valor. */
function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

/** Dois valores de campo são iguais quando são o mesmo valor ou quando os dois estão vazios. */
export function isSameFieldValue(a: unknown, b: unknown): boolean {
  if (isEmptyValue(a) && isEmptyValue(b)) return true;
  return Object.is(a, b);
}

/**
 * Compara campo a campo (comparação rasa) o estado atual com o inicial: o vazio, num cadastro novo, e
 * o carregado, numa edição. Os campos ignorados são os derivados de outros, como o nome do dono
 * buscado a partir do id, que mudam sem o usuário mexer.
 */
export function isFormDirty<T extends object>(
  initial: T,
  current: T,
  ignoredFields: readonly (keyof T)[] = [],
): boolean {
  const fields = new Set([...Object.keys(initial), ...Object.keys(current)]) as Set<keyof T>;
  for (const field of fields) {
    if (ignoredFields.includes(field)) continue;
    if (!isSameFieldValue(initial[field], current[field])) return true;
  }
  return false;
}
