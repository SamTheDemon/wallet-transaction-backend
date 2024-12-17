import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth') 
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,

  ) {}


    /**
   * User registration endpoint
   * @param userDto - Registration data
   * @returns User details excluding password
   */
    @Post('register')
    @UsePipes(ValidationPipe)
    async register(@Body() userDto: RegisterDto) {
      const user = await this.userService.create(userDto);
      const { password, ...result } = user;
      return {
        message: 'Registration successful',
        data: result,
      };
    }

/**
    * User login endpoint
    * @param loginDto - Login credentials
    * @returns JWT access token
    */
    @Post('login')
    @UsePipes(ValidationPipe)
    async login(@Body() loginDto: LoginDto) {
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      return {
        message: 'Login successful',
        data: await this.authService.login(user),
      };
    }
}
