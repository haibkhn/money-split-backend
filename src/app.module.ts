import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { GroupsModule } from './groups/groups.module';
import { MembersModule } from './members/members.module';
import { ExpensesModule } from './expenses/expenses.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { UrlService } from './services/url/url.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Set to false in production
        logging: ['error'], // Only log errors
        logger: 'advanced-console', // Use more readable console format
      }),
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
