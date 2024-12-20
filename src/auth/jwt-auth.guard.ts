import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly authService: AuthService) {
    super();
  }
  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
   if (err || !user){
    throw new UnauthorizedException("You are not authorized to access this resource");
   }
    // if (err || !user || this.authService.isTokenBlacklisted(token)) {
    //   throw new UnauthorizedException('You are not authorized to access this resource');
    // }

    // if ( this.authService.isTokenBlacklisted(token)) {
    //   throw new UnauthorizedException('Token has been revoked');
    // }
    return user;
  }
}