import { Controller, Get, Redirect, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('pay')
  @Redirect()
  payRedirect(@Query() query: any) {
    const params = new URLSearchParams(query).toString();
    return {
      url: `/payer.html?${params}`,
      statusCode: 302,
    };
  }
}