import { ImATeapotException } from "@nestjs/common";

export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new ImATeapotException('Only image files are allowed!'), false);
    }
    callback(null, true);
};
