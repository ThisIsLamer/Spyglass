import { PasswordCrypto } from "#src/core/utils/password.js";
import { orm } from "#src/database/index.js";
import { TokenService } from "#src/modules/v1/auth/token.service.js";
import { User } from "#src/modules/v1/user/user.entity.js";

const tokenService = new TokenService();

export class AuthService {
  private get em() { return orm.em; }

  async login(username: string, password: string) {
    const user = await this.em.findOne(User, { username });
    if (!user) return null;

    if (!user.isActive) return null;

    const valid = await PasswordCrypto.verify(password, user.passwordHash);
    if (!valid) return null;

    user.lastLoginAt = new Date();
    await this.em.flush();

    const token = await tokenService.create(user.guid, user.username, user.role);

    return {
      token,
      user: {
        guid: user.guid,
        username: user.username,
        displayName: user.displayName ?? user.username,
        role: user.role,
      },
    };
  }
}
