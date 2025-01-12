import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const getDatabaseConfig = (configService: any): TypeOrmModuleOptions => {
  if (process.env.NODE_ENV === 'production') {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // First time running the app, set this to true to create tables, then set to false
      ssl: {
        rejectUnauthorized: false,
      },
      logging: ['error'],
      logger: 'advanced-console',
    };
  }

  return {
    type: 'postgres',
    host: configService.get('DATABASE_HOST'),
    port: configService.get('DATABASE_PORT'),
    username: configService.get('DATABASE_USERNAME'),
    password: configService.get('DATABASE_PASSWORD'),
    database: configService.get('DATABASE_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: ['error'],
    logger: 'advanced-console',
  };
};

export default getDatabaseConfig;