import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({
      email,
      passwordHash,
    });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(userId: number, updateInput: UpdateUserInput): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    Object.assign(user, updateInput);
    return this.usersRepository.save(user);
  }

  async setTwoFactorSecret(userId: number, secret: string): Promise<void> {
    await this.usersRepository.update(userId, { twoFactorSecret: secret });
  }

  async enableTwoFactor(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { isTwoFactorEnabled: true });
  }

  async getTwoFactorSecret(userId: number): Promise<string | undefined> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException(`User id ${userId} not found`);
    return user.twoFactorSecret;
  }
}
