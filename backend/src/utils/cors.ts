export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(s => s.trim());
  }
  if (process.env.NODE_ENV === 'production') {
    return ['https://thevault.experiment'];
  }
  return ['http://localhost:3000', 'http://localhost:5173'];
}