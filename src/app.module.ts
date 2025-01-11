import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import getDatabaseConfig from './config/database.config';
import { GroupsModule } from './groups/groups.module';
import { MembersModule } from './members/members.module';
import { ExpensesModule } from './expenses/expenses.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { UrlService } from './services/url/url.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' 
        ? '.env.production' 
        : '.env.development',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    GroupsModule,
    MembersModule,
    ExpensesModule,
  ],
  providers: [UrlService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}