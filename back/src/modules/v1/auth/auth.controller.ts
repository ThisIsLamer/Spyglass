import { Controller, Post, Public, ValidateBody } from "#src/core/decorators/index.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthService } from "./auth.service.js";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginDto = z.infer<typeof loginSchema>;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 дней
};

@Controller('/auth')
export class AuthController {
  private authService = new AuthService();

  @Post('/login')
  @Public()
  @ValidateBody(loginSchema)
  async login(request: FastifyRequest<{ Body: LoginDto }>, reply: FastifyReply) {
    const result = await this.authService.login(request.body.username, request.body.password);

    if (!result) {
      return { success: false, message: 'Invalid username or password' };
    }

    reply.setCookie('token', result.token, COOKIE_OPTIONS);

    return { success: true, data: { user: result.user } };
  }

  @Post('/logout')
  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('token', { path: '/' });
    return { success: true };
  }
}
