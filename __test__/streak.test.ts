import { calculateStreaks } from '../src/utils';
import { streakSvg } from '../src/svgs';
import { Fetcher } from '../src/fetcher';
import { StreakData } from '../src/interfaces/interface';
import { fakeQueryStringRes } from './fakeInputs';

const day = (date: string, contributionCount: number) => ({ date, contributionCount });

describe('calculateStreaks', () => {
    it('treats today having no contributions yet as not breaking the streak', () => {
        const days = [
            day('2024-01-01', 1),
            day('2024-01-02', 1),
            day('2024-01-03', 1),
            day('2024-01-04', 0), // today - hasn't contributed yet
        ];
        expect(calculateStreaks(days)).toEqual({
            currentStreak: 3,
            longestStreak: 3,
            totalContributions: 3,
        });
    });

    it('breaks the current streak when yesterday also has no contributions', () => {
        const days = [
            day('2024-01-01', 1),
            day('2024-01-02', 1),
            day('2024-01-03', 0), // yesterday - genuinely broke the streak
            day('2024-01-04', 0), // today
        ];
        expect(calculateStreaks(days).currentStreak).toBe(0);
        expect(calculateStreaks(days).longestStreak).toBe(2);
    });

    it('carries a streak across a year boundary with no gap', () => {
        const days = [
            day('2023-12-29', 1),
            day('2023-12-30', 1),
            day('2023-12-31', 1),
            day('2024-01-01', 1),
            day('2024-01-02', 1),
        ];
        expect(calculateStreaks(days)).toEqual({
            currentStreak: 5,
            longestStreak: 5,
            totalContributions: 5,
        });
    });

    it('breaks the streak at a gap that falls on the year boundary', () => {
        const days = [
            day('2023-12-29', 1),
            day('2023-12-30', 1),
            day('2023-12-31', 0), // the gap, right at the boundary
            day('2024-01-01', 1),
            day('2024-01-02', 1),
        ];
        const result = calculateStreaks(days);
        expect(result.currentStreak).toBe(2);
        expect(result.longestStreak).toBe(2);
        expect(result.totalContributions).toBe(4);
    });

    it('handles an empty history', () => {
        expect(calculateStreaks([])).toEqual({
            currentStreak: 0,
            longestStreak: 0,
            totalContributions: 0,
        });
    });
});

describe('streakSvg', () => {
    const args = {
        height: 200,
        width: 495,
        colors: fakeQueryStringRes[0].colors,
        title: "u's Contribution Streak",
        radius: 0,
        currentStreak: 5,
        longestStreak: 12,
        totalContributions: 987,
    };

    it('renders the title and all three stats', () => {
        const svg = streakSvg(args);
        expect(svg).toContain("u's Contribution Streak");
        expect(svg).toContain('>987<');
        expect(svg).toContain('>5<');
        expect(svg).toContain('>12<');
        expect(svg).toContain('Total Contributions');
        expect(svg).toContain('Current Streak');
        expect(svg).toContain('Longest Streak');
    });

    it('uses the card colors', () => {
        const svg = streakSvg(args);
        expect(svg).toContain(`fill="#${args.colors.bgColor}"`);
        expect(svg).toContain(`fill:#${args.colors.color};`);
    });
});

describe('Fetcher.fetchStreakData', () => {
    it('fetches every year since account creation and returns the computed streaks', async () => {
        const currentYear = new Date().getUTCFullYear();
        const previousYear = currentYear - 1;
        const fetcher = new Fetcher('someone');
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                data: {
                    data: {
                        user: { name: 'Someone', createdAt: `${previousYear}-06-15T00:00:00Z` },
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        [`year${previousYear}`]: {
                            contributionsCollection: {
                                contributionCalendar: {
                                    weeks: [
                                        {
                                            contributionDays: [
                                                {
                                                    contributionCount: 1,
                                                    date: `${previousYear}-12-30`,
                                                },
                                                {
                                                    contributionCount: 1,
                                                    date: `${previousYear}-12-31`,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                        [`year${currentYear}`]: {
                            contributionsCollection: {
                                contributionCalendar: {
                                    weeks: [
                                        {
                                            contributionDays: [
                                                { contributionCount: 1, date: `${currentYear}-01-01` },
                                                { contributionCount: 0, date: `${currentYear}-01-02` },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            });
        // @ts-ignore: mocking private method
        fetcher.fetch = fetchMock;

        const data = (await fetcher.fetchStreakData()) as StreakData;

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const secondCallQuery = fetchMock.mock.calls[1][0].query;
        expect(secondCallQuery).toContain(`year${previousYear}`);
        expect(secondCallQuery).toContain(`year${currentYear}`);
        expect(data.name).toBe('Someone');
        expect(data.totalContributions).toBe(3);
        // today (<currentYear>-01-02) has 0 contributions, so it's skipped, giving a
        // current streak of 3 running back through the year boundary.
        expect(data.currentStreak).toBe(3);
        expect(data.longestStreak).toBe(3);
    });

    it('returns an error string when the username does not resolve', async () => {
        const fetcher = new Fetcher('nobody');
        // @ts-ignore: mocking private method
        fetcher.fetch = jest.fn().mockResolvedValue({
            data: { data: { user: null } },
        });

        const data = await fetcher.fetchStreakData();
        expect(data).toEqual(`Can't fetch any contribution. Please check your username 😬`);
    });
});
