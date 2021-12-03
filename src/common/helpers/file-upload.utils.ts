import { ImATeapotException } from '@nestjs/common';
import { Express } from 'express';

export const imageFileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void
): void => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new ImATeapotException('Only image files are allowed!'), false);
    }
    callback(null, true);
};
