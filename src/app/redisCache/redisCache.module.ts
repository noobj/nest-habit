import { Module, CacheModule } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { RedisCacheService } from './redisCache.service';

@Module({
    imports: [
        CacheModule.register({
            redisStore,
            host: '127.0.0.1',
            port: 6379,
            ttl: 9999,
        }),
    ],
    providers: [RedisCacheService],
    exports: [RedisCacheService],
})
export class RedisCacheModule {}
