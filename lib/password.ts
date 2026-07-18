export const PASSWORD_MIN_LENGTH = 8

export function validatePassword(password: string) {
  const issues: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`au moins ${PASSWORD_MIN_LENGTH} caractères`)
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('une lettre majuscule')
  }

  if (!/[a-z]/.test(password)) {
    issues.push('une lettre minuscule')
  }

  if (!/\d/.test(password)) {
    issues.push('un chiffre')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push('un caractère spécial')
  }

  if (/\s/.test(password)) {
    issues.push('pas d’espace')
  }

  return {
    isValid: issues.length === 0,
    issues,
    message: issues.length > 0
      ? `Mot de passe invalide : ${issues.join(', ')}`
      : 'Mot de passe valide',
  }
}

export function getPasswordHelpText() {
  return '8+ caractères, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
}
