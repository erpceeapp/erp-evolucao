// Traduções de mensagens de erro do Supabase Auth e outras mensagens comuns
const errorTranslations: Record<string, string> = {
  // Autenticação
  "Invalid login credentials": "Credenciais de login inválidas",
  "Email not confirmed": "Email não confirmado",
  "Invalid email or password": "Email ou senha inválidos",
  "User not found": "Usuário não encontrado",
  "User already registered": "Usuário já cadastrado",
  "Password is too short": "A senha é muito curta",
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
  "Email address is invalid": "Endereço de email inválido",
  "Signup requires a valid password": "O cadastro requer uma senha válida",
  "Unable to validate email address: invalid format": "Não foi possível validar o email: formato inválido",
  "Password should contain at least one character of each": "A senha deve conter pelo menos um caractere de cada tipo",
  "Auth session missing!": "Sessão de autenticação ausente!",
  "New password should be different from the old password": "A nova senha deve ser diferente da senha atual",
  "User not allowed": "Usuário não permitido",
  "Email rate limit exceeded": "Limite de envio de emails excedido. Tente novamente mais tarde",
  "For security purposes, you can only request this once every 60 seconds": "Por segurança, você só pode fazer esta solicitação a cada 60 segundos",
  
  // Banco de dados
  "duplicate key value violates unique constraint": "Registro duplicado. Este valor já existe no sistema",
  "violates foreign key constraint": "Este registro está vinculado a outros dados e não pode ser modificado",
  "null value in column": "Campo obrigatório não preenchido",
  "value too long for type": "Valor muito longo para este campo",
  
  // Rede
  "Failed to fetch": "Falha na conexão. Verifique sua internet",
  "Network request failed": "Falha na requisição de rede",
  "Network Error": "Erro de rede",
  "Request timeout": "Tempo de requisição esgotado",
  
  // Genéricos
  "Something went wrong": "Algo deu errado",
  "An error occurred": "Ocorreu um erro",
  "Unexpected error": "Erro inesperado",
  "Internal server error": "Erro interno do servidor",
  "Service unavailable": "Serviço indisponível",
  "Bad request": "Requisição inválida",
  "Unauthorized": "Não autorizado",
  "Forbidden": "Acesso negado",
  "Not found": "Não encontrado",
}

export function translateError(errorMessage: string): string {
  if (!errorMessage) return "Ocorreu um erro desconhecido"
  
  // Tentar encontrar uma tradução exata primeiro
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage]
  }
  
  // Tentar encontrar uma tradução parcial (para mensagens que contenham parte do texto)
  for (const [english, portuguese] of Object.entries(errorTranslations)) {
    if (errorMessage.toLowerCase().includes(english.toLowerCase())) {
      return portuguese
    }
  }
  
  // Se não encontrar tradução, retornar a mensagem original
  return errorMessage
}
