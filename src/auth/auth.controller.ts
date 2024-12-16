import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

@Controller('auth') 
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,

  ) {}

  @Post('register')
  async register(@Body() userDto: { name: string; email: string; password: string }) {
    const user = await this.userService.create(userDto);
    const { password, ...result } = user; // Exclude the password from the response
    return result;
  }  

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return this.authService.login(user);
  }
}
