import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createAccount(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.createAccount(req.user.ownerId, createAccountDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAccounts(@Request() req) {
    return this.accountsService.getAccounts(req.user.ownerId);
  }
}