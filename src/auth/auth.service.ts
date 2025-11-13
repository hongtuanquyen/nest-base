import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(input: RegisterInput) {
    const hashed = await argon2.hash(input.password);
    const user = await this.usersService.create(input.email, hashed);
    return user;
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isTwoFactorEnabled) {
      const payload = { sub: user.id };
      return this.jwtService.sign(payload);
    } else {
      // create temp token with flag twoFactorRequired = true
      const payload = { sub: user.id, twoFactorRequired: true };
      return this.jwtService.sign(payload);
    }
  }

  async generateTwoFactorSecret(user: User) {
    console.log('Generating 2FA secret for user:', user.email);
    const secret = authenticator.generateSecret();
    console.log('Generated secret:', secret);
    const otpauthUrl = authenticator.keyuri(
      user.email ?? '',
      'SecureNotesVault',
      secret,
    );
    console.log('OTP Auth URL:', otpauthUrl);
    await this.usersService.setTwoFactorSecret(user.id, secret);
    const qrCodeImage = await qrcode.toDataURL(otpauthUrl);
    console.log('QR Code Image URL:', qrCodeImage);
    return qrCodeImage;
  }

  async enableTwoFactor(code: string, user: any) {
    const secret = await this.usersService.getTwoFactorSecret(user.id);
    const isValid = authenticator.verify({ token: code, secret: secret ?? '' });
    if (!isValid) throw new UnauthorizedException('Wrong two-factor code');
    await this.usersService.enableTwoFactor(user.id);
    // issue full access JWT
    const payload = { sub: user.id, twoFactorAuthenticated: true };
    return this.jwtService.sign(payload);
  }
}
