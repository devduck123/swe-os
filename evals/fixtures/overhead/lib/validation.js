export function validatePassword(password) {
  if (password.length < 8) return 'Password must be atleast 8 charaters';
  return null;
}

export function validateEmail(email) {
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) return 'Enter a valid email';
  return null;
}
