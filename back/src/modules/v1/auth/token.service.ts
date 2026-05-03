import { SignJWT, jwtVerify } from 'jose';
import { GLOBAL_CONFIG } from '#src/config.js';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

const secret = new TextEncoder().encode(GLOBAL_CONFIG.APP.JWT_SECRET);
const JWT_TTL = '7d';

export class TokenService {
  async create(userGuid: string, username: string, role: string): Promise<string> {
    return new SignJWT({ username, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userGuid)
      .setIssuedAt()
      .setExpirationTime(JWT_TTL)
      .sign(secret);
  }

  async verify(token: string): Promise<JwtPayload | null> {
    try {
      const { payload } = await jwtVerify(token, secret);

      return {
        sub: payload.sub!,
        username: payload.username as string,
        role: payload.role as string,
      };
    } catch {
      return null;
    }
  }
}
