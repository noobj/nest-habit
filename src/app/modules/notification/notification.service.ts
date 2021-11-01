import { Injectable } from '@nestjs/common';
import { Repository, EntityRepository } from 'typeorm';

import { Notification } from './notification.entity';

@Injectable()
@EntityRepository(Notification)
export class NotificationService extends Repository<Notification> {}
