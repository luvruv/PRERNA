import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this._isConnected = true;
      this.logger.log('✅ Connected to database successfully');
    } catch (err: any) {
      this._isConnected = false;
      this.logger.warn(
        `⚠️ Could not connect to PostgreSQL database (localhost:5432). Running in offline/demo fallback mode. Details: ${err.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
