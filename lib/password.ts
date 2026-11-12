import bcrypt from 'bcryptjs';

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash "de mentira" para que el login tarde lo mismo exista o no el email
// (así no se puede averiguar qué emails están registrados midiendo tiempos).
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= bcrypt.hash('not-a-real-password', COST);
  return dummyHash;
}
