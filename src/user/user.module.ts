import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user/user';
import { UserService } from './user.service';


@Module({
  imports: [TypeOrmModule.forFeature([User])], // Ensure the User entity is here
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}

