import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { TwoFactorInput } from './dto/two-factor.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => String) // returning access token or temp token
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async initiateTwoFactor(@CurrentUser() user: User) {
    return this.authService.generateTwoFactorSecret(user);
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async confirmTwoFactor(
    @Args('input') input: TwoFactorInput,
    @CurrentUser() user: User,
  ) {
    return this.authService.enableTwoFactor(input.code, user);
  }
}
