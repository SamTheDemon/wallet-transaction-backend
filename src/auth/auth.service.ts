import { Injectable, UnauthorizedException, NotFoundException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}



  /**
   * Validate user credentials and return the user without the password
   * @param email - User's email
   * @param password - User's plain text password
   * @returns User object excluding password
   */

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    } 
    
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user; // Exclude password
    return result;
  }

    /**
   * Generate JWT access token for a validated user
   * @param user - User object
   * @returns Object with JWT access_token
   */

    async login(user: { id: number; email: string; name: string }): Promise<{ access_token: string }> {
      const payload = { email: user.email, sub: user.id, name: user.name };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }

}
