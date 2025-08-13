import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { QrCodesService } from './qrcodes.service';
import { CreateQrCodeDto } from './dto/create-qrcode.dto';
import { SyncQrCodesDto } from './dto/sync-qrcodes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('qrcodes')
export class QrCodesController {
  constructor(private qrCodesService: QrCodesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createQrCode(@Request() req, @Body() createQrCodeDto: CreateQrCodeDto) {
    const qrCode = await this.qrCodesService.createQrCode(req.user.ownerId, createQrCodeDto);
    const qrCodeImage = await this.qrCodesService.generateQrCodeImage(qrCode);
    return { ...qrCode, qrCodeImage };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getQrCodes(@Request() req) {
    const qrCodes = await this.qrCodesService.getQrCodes(req.user.ownerId);
    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qrCode) => {
        const qrCodeImage = await this.qrCodesService.generateQrCodeImage(qrCode);
        return { ...qrCode, qrCodeImage };
      }),
    );
    return qrCodesWithImages;
  }

  @Get(':id')
  async getQrCode(@Param('id') id: string) {
    const qrCode = await this.qrCodesService.getQrCode(id);
    const qrCodeImage = await this.qrCodesService.generateQrCodeImage(qrCode);
    return { ...qrCode, qrCodeImage };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateQrCode(@Request() req, @Param('id') id: string, @Body() updateQrCodeDto: CreateQrCodeDto) {
    const qrCode = await this.qrCodesService.updateQrCode(req.user.ownerId, id, updateQrCodeDto);
    const qrCodeImage = await this.qrCodesService.generateQrCodeImage(qrCode);
    return { ...qrCode, qrCodeImage };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteQrCode(@Request() req, @Param('id') id: string) {
    await this.qrCodesService.deleteQrCode(req.user.ownerId, id);
    return { message: 'QR code deleted successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncQrCodes(@Request() req, @Body() syncQrCodesDto: SyncQrCodesDto) {
    const result = await this.qrCodesService.syncLocalQrCodes(req.user.ownerId, syncQrCodesDto.localQrCodes);
    return result;
  }
}