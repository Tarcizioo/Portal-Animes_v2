const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Digite um e-mail válido.',
  'auth/email-already-in-use': 'Este e-mail já possui uma conta. Tente entrar ou recuperar a senha.',
  'auth/account-exists-with-different-credential': 'Este e-mail já usa outro método de entrada. Tente continuar com o Google.',
  'auth/weak-password': 'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Não foi possível conectar. Confira sua internet e tente novamente.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.',
  'auth/operation-not-allowed': 'Este método de entrada ainda não está disponível.',
  'auth/user-disabled': 'Esta conta está desativada.',
};

const QUIET_AUTH_ERRORS = new Set([
  'auth/cancelled-popup-request',
  'auth/popup-closed-by-user',
]);

export function getAuthErrorMessage(error) {
  if (QUIET_AUTH_ERRORS.has(error?.code)) return '';
  return AUTH_ERROR_MESSAGES[error?.code] || 'Não foi possível concluir agora. Tente novamente.';
}
