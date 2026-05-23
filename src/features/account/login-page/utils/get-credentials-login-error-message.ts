export function getCredentialsLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("D1 binding DB is not available")) {
    return "Não foi possível criar a sessão neste ambiente.";
  }

  return "Não foi possível entrar agora. Tente novamente.";
}
