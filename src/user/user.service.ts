import { Injectable, ConflictException,InternalServerErrorException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user/user';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

    /**
   * Create a new user with hashed password
   * @param userDto - User details: name, email, password
   */

  async create(userDto: { name: string; email: string; password: string }): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userDto.password, 10);

      const newUser = this.userRepository.create({
        ...userDto,
        password: hashedPassword,
      });

      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error.code === '23505') {
          // PostgreSQL unique violation error code
          throw new ConflictException('Email already exists');
        }
        //console.error('Error creating user:', error.message); // Log for debugging
        throw new InternalServerErrorException('Failed to create user');
      }
  }



 /**
   * Find a user by email
   * @param email - User's email address
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

    /**
   * Find a user by ID
   * @param id - User's unique identifier
   */
  async findById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }
}
