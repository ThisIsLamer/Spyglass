import { Controller, Get, Post, Put, Roles, ValidateBody, ValidateParams } from "#src/core/decorators/index.js";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { UserRole } from "./user.entity.js";
import { UserPresenter } from "./user.presenter.js";
import { UserService } from "./user.service.js";

const guidParams = z.object({
  guid: z.string().uuid(),
});

type GuidParams = z.infer<typeof guidParams>;

const createSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(128),
  displayName: z.string().max(128).optional(),
  role: z.nativeEnum(UserRole).optional(),
  language: z.string().max(5).optional(),
});

type CreateDto = z.infer<typeof createSchema>;

const updateSchema = z.object({
  displayName: z.string().max(128).optional(),
  role: z.enum(UserRole).optional(),
  language: z.string().max(5).optional(),
  password: z.string().min(8).max(128).optional(),
  isActive: z.boolean().optional(),
});

type UpdateDto = z.infer<typeof updateSchema>;

const languageSchema = z.object({
  language: z.string().min(2).max(5),
});

type LanguageDto = z.infer<typeof languageSchema>;

@Controller('/users')
export class UserController {
  private userService = new UserService();

  @Get('/me')
  async me(request: FastifyRequest) {
    return { success: true, user: request.user };
  }

  @Get('/')
  @Roles('admin')
  async getAll() {
    const users = await this.userService.findAll();
    return { success: true, data: UserPresenter.presentMany(users) };
  }

  @Post('/')
  @Roles('admin')
  @ValidateBody(createSchema)
  async create(request: FastifyRequest<{ Body: CreateDto }>) {
    const { displayName, language, ...rest } = request.body;

    const user = await this.userService.create({
      ...rest,
      ...(displayName && { displayName }),
      ...(language && { language }),
    });

    if (!user) {
      return { success: false, error: 'Username already exists' };
    }

    return { success: true, data: UserPresenter.present(user) };
  }

  @Put('/:guid')
  @Roles('admin')
  @ValidateParams(guidParams)
  @ValidateBody(updateSchema)
  async update(request: FastifyRequest<{ Params: GuidParams; Body: UpdateDto }>) {
    const user = await this.userService.update(request.params.guid, request.body);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, data: UserPresenter.present(user) };
  }

  @Post('/me/language')
  @ValidateBody(languageSchema)
  async setLanguage(request: FastifyRequest<{ Body: LanguageDto }>) {
    const user = await this.userService.setLanguage(request.user.guid, request.body.language);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, data: UserPresenter.present(user) };
  }
}
