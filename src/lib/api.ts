export function getErrorMessage(value: unknown) {
  if (value instanceof Error) {
    return value.message;
  }

  return "Algo deu errado. Tente novamente.";
}
