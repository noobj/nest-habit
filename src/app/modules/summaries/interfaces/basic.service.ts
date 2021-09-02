import { User } from '../../users';

export interface IBasicService {
    getRawDailySummaries(startDate: string, endDate: string, user: User);

    processTheRawSummaries(rawData);

    getLongestDayRecord(rawData);

    getTotalDuration(rawData);

    getTotalThisMonth(rawData);

    getCurrentStreak(user: User);
}
