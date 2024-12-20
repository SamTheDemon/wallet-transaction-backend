import { Injectable, UnauthorizedException, NotFoundException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private refreshTokens: Map<number, string> = new Map();

  private blacklistedTokens: Set<string> = new Set();
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}



  /**
   * 1- Validate user credentials and return the user without the password
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
   * 2- Generates an access token and a refresh token for the authenticated user.
   * @param user - User object
   * @returns Object with JWT access_token
   */

    async login(user: { id: number; email: string; name: string }): Promise<{ access_token: string; refresh_token: string }> {
      const payload = { email: user.email, sub: user.id, name: user.name };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.generateRefreshToken(user.id);
  
      // Store the refresh token securely
      this.refreshTokens.set(user.id, refreshToken);
  
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    }

    // 3- Logs out the user by blacklisting the provided token
    logout(token: string): void {
      this.blacklistedTokens.add(token);
    }

    // 4- Generates a refresh token with a 7-day expiration for the given user ID.
    private generateRefreshToken(userId: number): string {
      const payload = { sub: userId };
      return this.jwtService.sign(payload, { expiresIn: '7d' }); // Long-lived token
    }
  
    // 5- Validates the provided refresh token and ensures it matches the stored token.

    validateRefreshToken(token: string): { userId: number } | null {
      try {
        const decoded = this.jwtService.verify(token);
        const storedToken = this.refreshTokens.get(decoded.sub);
  
        if (storedToken === token) {
          return { userId: decoded.sub };
        }
        return null;
      } catch {
        return null;
      }
    }
  
    // 6- Revokes the refresh token associated with the given user ID.
    revokeRefreshToken(userId: number): void {
      this.refreshTokens.delete(userId);
    }
}
