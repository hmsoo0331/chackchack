import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from '../entities/owner.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
    private jwtService: JwtService,
  ) {}

  async createGuestOwner(deviceToken?: string): Promise<{ owner: Owner; accessToken: string }> {
    const owner = this.ownerRepository.create({
      deviceToken: deviceToken || uuidv4(),
      authProvider: 'guest',
    });

    await this.ownerRepository.save(owner);

    const payload = { ownerId: owner.ownerId, deviceToken: owner.deviceToken };
    const accessToken = this.jwtService.sign(payload);

    return { owner, accessToken };
  }

  async socialLogin(
    email: string,
    nickname: string,
    authProvider: string,
    deviceToken?: string,
  ): Promise<{ owner: Owner; accessToken: string }> {
    let owner = await this.ownerRepository.findOne({ where: { email, authProvider } });

    if (!owner) {
      owner = this.ownerRepository.create({
        email,
        nickname,
        authProvider,
        deviceToken,
      });
    } else {
      owner.lastLoginAt = new Date();
      if (deviceToken) {
        owner.deviceToken = deviceToken;
      }
    }

    await this.ownerRepository.save(owner);

    const payload = { ownerId: owner.ownerId, email: owner.email };
    const accessToken = this.jwtService.sign(payload);

    return { owner, accessToken };
  }

  async validateOwner(ownerId: string): Promise<Owner> {
    const owner = await this.ownerRepository.findOne({ where: { ownerId } });
    if (!owner) {
      throw new UnauthorizedException('Invalid owner');
    }
    return owner;
  }

  async logout(ownerId: string): Promise<{ message: string }> {
    // JWT는 stateless이므로 서버에서 토큰을 무효화할 수 없습니다.
    // 실제 구현에서는 Redis blacklist나 토큰 만료 시간을 짧게 설정하는 방법을 고려할 수 있습니다.
    // 현재는 클라이언트에서 토큰을 삭제하는 것으로 처리합니다.
    
    // 마지막 로그인 시간 업데이트 (로그아웃 시간으로 활용)
    await this.ownerRepository.update(ownerId, { lastLoginAt: new Date() });
    
    return { message: 'Logout successful' };
  }

  async deleteAccount(ownerId: string): Promise<{ message: string }> {
    // 사용자 존재 확인
    const owner = await this.ownerRepository.findOne({ where: { ownerId } });
    if (!owner) {
      throw new UnauthorizedException('User not found');
    }

    // CASCADE 설정으로 관련 데이터도 함께 삭제됩니다
    // 순서: PaymentNotifications → QrCodes → BankAccounts → Owner
    await this.ownerRepository.delete(ownerId);
    
    return { message: 'Account deleted successfully' };
  }
}