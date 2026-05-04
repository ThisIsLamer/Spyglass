import { eventBus } from "#src/core/events/event-bus.js";
import { logBlock } from "#src/core/utils/logger.js";
import { generatePassword, PasswordCrypto } from "#src/core/utils/password.js";
import { orm } from "#src/database/index.js";
import { UserPresenter } from "./user.presenter.js";
import { User, UserRole } from "./user.entity.js";

export interface CreateUserDto {
  username: string;
  password: string;
  displayName?: string | undefined;
  role?: UserRole | undefined;
  language?: string | undefined;
}

export interface UpdateUserDto {
  displayName?: string | undefined;
  role?: UserRole | undefined;
  language?: string | undefined;
  password?: string | undefined;
  isActive?: boolean | undefined;
}

export class UserService {
  private get em() { return orm.em; }

  async findAll() {
    return this.em.find(User, {});
  }

  async findById(id: number) {
    return this.em.findOne(User, { id });
  }

  async findByUsername(username: string) {
    return this.em.findOne(User, { username });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.findByUsername(dto.username);
    if (existing) return null;

    const user = this.em.create(User, {
      username: dto.username,
      passwordHash: await PasswordCrypto.hash(dto.password),
      role: dto.role ?? UserRole.VIEWER,
      ...(dto.displayName && { displayName: dto.displayName }),
      ...(dto.language && { language: dto.language }),
    });

    await this.em.flush();

    eventBus.emit({
      event: 'user.created',
      data: UserPresenter.present(user),
      target: { roles: ['admin'] },
    });

    return user;
  }

  async update(guid: string, dto: UpdateUserDto) {
    const user = await this.em.findOne(User, { guid });
    if (!user) return null;

    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.language !== undefined) user.language = dto.language;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) user.passwordHash = await PasswordCrypto.hash(dto.password);

    await this.em.flush();

    eventBus.emit({
      event: 'user.updated',
      data: UserPresenter.present(user),
      target: { roles: ['admin'], userGuids: [user.guid] },
    });

    return user;
  }

  async setLanguage(userGuid: string, language: string) {
    const user = await this.em.findOne(User, { guid: userGuid });
    if (!user) return null;

    user.language = language;
    await this.em.flush();

    eventBus.emit({
      event: 'user.updated',
      data: UserPresenter.present(user),
      target: { userGuids: [user.guid] },
    });

    return user;
  }

  async initUsers() {
    const em = orm.em.fork();
    const admins = await em.find(User, { role: UserRole.ADMIN });
    if (admins.length > 0) return;

    const password = generatePassword();

    em.create(User, {
      username: 'admin',
      passwordHash: await PasswordCrypto.hash(password),
      displayName: 'Admin',
      role: UserRole.ADMIN,
    });

    await em.flush();

    logBlock({
      title: 'Admin account created',
      fields: {
        Username: 'admin',
        Password: password,
      },
      warning: "Save this password, it won't be shown again!",
    });
  }
}
