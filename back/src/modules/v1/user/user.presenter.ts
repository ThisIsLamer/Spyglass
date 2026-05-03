import { User } from "./user.entity.js";

export class UserPresenter {
  static present(user: User) {
    return {
      guid: user.guid,
      username: user.username,
      displayName: user.displayName ?? user.username,
      role: user.role,
      lastLoginAt: user.lastLoginAt ?? null,
      language: user.language ?? null,
      createdAt: user.createdAt,
    };
  }

  static presentMany(users: User[]) {
    return users.map(UserPresenter.present);
  }
}
