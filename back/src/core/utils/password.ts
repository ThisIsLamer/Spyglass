import crypto from 'crypto';
import argon2 from 'argon2';

import { GLOBAL_CONFIG } from "#src/config.js";

const paper = GLOBAL_CONFIG.APP.PAPER

export function generatePassword(length: number = 16) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

export class PasswordCrypto {
  static addPaper(password: string): string {
    return crypto
      .createHmac('sha256', paper)
      .update(password)
      .digest('hex');
  }

  static async hash(password: string): Promise<string> {
    const paperedPassword = PasswordCrypto.addPaper(password)

    return argon2.hash(paperedPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 2,
    })
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      const paperedPassword = PasswordCrypto.addPaper(password)
      return await argon2.verify(hash, paperedPassword)
    } catch (error) {
      return false
    }
  }

}