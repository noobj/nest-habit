import {
    Controller,
    Get,
    Query,
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

    @Get(':project?')
    async showAll(
        @Param('project') projectName: string,
        @Query('start_date') startDate: string,
        @Query('end_date') endDate: string,
    ) {
        return {
            statusCode: HttpStatus.OK,
            data: await this.summariesService.getRangeDailySummaries(projectName, startDate, endDate),
        };
    }
}
