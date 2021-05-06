export interface IBasicService {
    getRawDailySummaries(project: string, startDate: string, endDate: string);

    processTheRawSummaries(rawData);

    getLongestDayRecord(rawData);

    getTotalDuration(rawData);

    getTotalThisMonth(rawData);
}
