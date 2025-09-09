import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Delete, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  async createGuest(@Body() createGuestDto: CreateGuestDto) {
    return this.authService.createGuestOwner(createGuestDto.deviceToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    return this.authService.socialLogin(
      socialLoginDto.email,
      socialLoginDto.nickname,
      socialLoginDto.authProvider,
      socialLoginDto.deviceToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return this.authService.logout(req.user.ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('privacy-consent')
  @HttpCode(HttpStatus.OK)
  async updatePrivacyConsent(@Request() req) {
    return this.authService.updatePrivacyConsent(req.user.ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('privacy-consent')
  @HttpCode(HttpStatus.OK)
  async getPrivacyConsentStatus(@Request() req) {
    return this.authService.getPrivacyConsentStatus(req.user.ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req) {
    return this.authService.deleteAccount(req.user.ownerId);
  }
}