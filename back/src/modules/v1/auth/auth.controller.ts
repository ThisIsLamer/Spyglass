import { Controller, Post, Public, ValidateBody } from "#src/core/decorators/index.js";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthService } from "./auth.service.js";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginDto = z.infer<typeof loginSchema>;

@Controller('/auth')
export class AuthController {
  private authService = new AuthService();

  @Post('/login')
  @Public()
  @ValidateBody(loginSchema)
  async login(request: FastifyRequest<{ Body: LoginDto }>) {
    const result = await this.authService.login(request.body.username, request.body.password);

    if (!result) {
      return { success: false, message: 'Invalid username or password' };
    }

    return { success: true, data: result };
  }

  @Post('/logout')
  async logout() {
    return { success: true };
  }
}
