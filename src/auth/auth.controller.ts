import { Controller, Post, Body, UsePipes, ValidationPipe, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthModule } from './auth.module';

@Controller('auth') 
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,

  ) {}

// 1- Registers a new user with the provided details and returns the user data excluding the password.
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

// 2- Authenticates the user and returns access and refresh tokens upon successful login.
    @Post('login')
    @UsePipes(ValidationPipe)
    async login(@Body() loginDto: LoginDto) {
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      const tokens = await this.authService.login(user);
      return {
        message: 'Login successful',
        data: tokens,
      };
    }
    
// 3- Logs out the authenticated user by blacklisting the provided token.
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Req() req) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new UnauthorizedException('Token not provided');
      }
      this.authService.logout(token);
      return { message: 'Logout successful' };
    }

    // 4- Generates a new access token using a valid refresh token.
   @Post('refresh-token')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    const validated = this.authService.validateRefreshToken(refreshToken);

    if (!validated) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userService.findById(validated.userId);
    const newAccessToken = this.authService.login({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      message: 'Token refreshed successfully',
      data: {
        access_token: (await newAccessToken).access_token,
      },
    };
  }
}
