import { Controller, Get, Post, Param, UseGuards, Request, Ip } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  async getNotifications(@Request() req) {
    return this.notificationsService.getNotifications(req.user.ownerId);
  }

  @Post('notify/:qrId')
  async notify(@Param('qrId') qrId: string, @Ip() ip: string) {
    return this.notificationsService.createNotification(qrId, ip);
  }
}