import {
    Injectable,
    UnauthorizedException,
    ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Injectable()
export class BasicAuthGuard extends AuthGuard('basic') {
    handleRequest(err, user, info, context: ExecutionContext, status) {
        if (err || !user) {
            const res = context.switchToHttp().getResponse<Response>();
            res.set({ 'WWW-Authenticate': 'basic' });
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
