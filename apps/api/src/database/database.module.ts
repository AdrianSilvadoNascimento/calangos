import { Global, Module } from '@nestjs/common';
import { getDb } from '@enxoval/db';
import type { DB } from '@enxoval/db';

export const DB_TOKEN = Symbol('DB');

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useFactory: () => getDb(),
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}

export type { DB };
