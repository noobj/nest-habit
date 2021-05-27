import { Request, Response, NextFunction } from 'express';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';

export function staticChecker(req: Request, res: Response, next: NextFunction) {
    if (req.url.match(/^\/img\//)) {
        if (!fs.existsSync(`${process.cwd()}/dist/public${req.url}`))
            throw new NotFoundException();
    }

    next();
}
