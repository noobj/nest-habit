import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpStatus,
} from '@nestjs/common';
import { SummariesService } from './summaries.service';

@Controller('summaries')
export class SummariesController {
    constructor(private summariesService: SummariesService) {}

    @Get()
    async showAllUsers() {
        return {
            statusCode: HttpStatus.OK,
            data: await this.summariesService.showAll(),
        };
    }
}
