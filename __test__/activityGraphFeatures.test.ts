import { Utilities, movingAverage } from '../src/utils';
import { Card } from '../src/GraphCards';
import { Fetcher } from '../src/fetcher';
import { UserDetails } from '../src/interfaces/interface';
import { fakeQueryStringRes } from './fakeInputs';

const flags = (query: Record<string, string>) =>
    new Utilities({ username: 'u', ...query }).queryOptions();

describe('show_private, compare and trend query options', () => {
    it('all default to off', () => {
        const options = flags({});
        expect(options.show_private).toBe(false);
        expect(options.compare).toBe(false);
        expect(options.trend).toBe(false);
    });

    it('show_private only turns on for "true"', () => {
        expect(flags({ show_private: 'true' }).show_private).toBe(true);
        expect(flags({ show_private: 'false' }).show_private).toBe(false);
        expect(flags({ show_private: 'yes' }).show_private).toBe(false);
    });

    it('compare only turns on for "year"', () => {
        expect(flags({ compare: 'year' }).compare).toBe(true);
        expect(flags({ compare: 'month' }).compare).toBe(false);
        expect(flags({ compare: 'true' }).compare).toBe(false);
    });

    it('trend only turns on for "true"', () => {
        expect(flags({ trend: 'true' }).trend).toBe(true);
        expect(flags({ trend: 'false' }).trend).toBe(false);
    });
});

describe('movingAverage', () => {
    it('averages over a trailing window, partial at the start', () => {
        expect(movingAverage([1, 2, 3, 4, 5, 6, 7, 8], 7)).toEqual([
            1, 1.5, 2, 2.5, 3, 3.5, 4, 5,
        ]);
    });

    it('defaults to a 7-day window', () => {
        expect(movingAverage([7, 7, 7, 7, 7, 7, 7, 0])).toEqual([
            7, 7, 7, 7, 7, 7, 7, 6,
        ]);
    });

    it('returns an array the same length as the input, even for a single value', () => {
        expect(movingAverage([5])).toEqual([5]);
        expect(movingAverage([])).toEqual([]);
    });
});

describe('getGraphQLQuery with a previous-year comparison', () => {
    const fetcher = new Fetcher('someone');

    it('adds restrictedContributionsCount to the base query', () => {
        // @ts-ignore: testing private method
        const { query } = fetcher.getGraphQLQuery('2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z');
        expect(query).toContain('restrictedContributionsCount');
        expect(query).not.toContain('userPrevious');
    });

    it('adds an aliased userPrevious query and its variables when asked', () => {
        // @ts-ignore: testing private method
        const built = fetcher.getGraphQLQuery(
            '2024-01-01T00:00:00.000Z',
            '2024-02-01T00:00:00.000Z',
            { from: '2023-01-01T00:00:00.000Z', to: '2023-02-01T00:00:00.000Z' },
        );
        expect(built.query).toContain('userPrevious: user(login: $LOGIN)');
        expect(built.query).toContain('$FROM_PREV: DateTime!');
        expect(built.query).toContain('$TO_PREV: DateTime!');
        expect(built.variables).toEqual({
            LOGIN: 'someone',
            FROM: '2024-01-01T00:00:00.000Z',
            TO: '2024-02-01T00:00:00.000Z',
            FROM_PREV: '2023-01-01T00:00:00.000Z',
            TO_PREV: '2023-02-01T00:00:00.000Z',
        });
    });
});

describe('fetchContributions with compareYear', () => {
    it('captures restrictedContributionsCount and a length-matched previousYearContributions', async () => {
        const fetcher = new Fetcher('someone');
        // @ts-ignore: mocking private method
        fetcher.fetch = jest.fn().mockResolvedValue({
            data: {
                data: {
                    user: {
                        name: 'Someone',
                        contributionsCollection: {
                            restrictedContributionsCount: 42,
                            contributionCalendar: {
                                weeks: [
                                    {
                                        contributionDays: [
                                            { contributionCount: 1, date: '2024-01-01' },
                                            { contributionCount: 2, date: '2024-01-02' },
                                            { contributionCount: 3, date: '2024-01-03' },
                                            { contributionCount: 4, date: '2024-01-04' },
                                            { contributionCount: 5, date: '2024-01-05' },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    userPrevious: {
                        contributionsCollection: {
                            contributionCalendar: {
                                weeks: [
                                    {
                                        contributionDays: [
                                            { contributionCount: 9, date: '2023-01-01' },
                                            { contributionCount: 9, date: '2023-01-02' },
                                            { contributionCount: 9, date: '2023-01-03' },
                                            { contributionCount: 9, date: '2023-01-04' },
                                            { contributionCount: 9, date: '2023-01-05' },
                                            { contributionCount: 9, date: '2023-01-06' },
                                            { contributionCount: 9, date: '2023-01-07' },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        });

        const data = (await fetcher.fetchContributions(
            5,
            '2024-01-01',
            '2024-01-05',
            true,
        )) as UserDetails;

        expect(data.restrictedContributionsCount).toBe(42);
        expect(data.previousYearContributions).toHaveLength(data.contributions.length);
    });

    it('omits previousYearContributions when compareYear is not requested', async () => {
        const fetcher = new Fetcher('someone');
        // @ts-ignore: mocking private method
        fetcher.fetch = jest.fn().mockResolvedValue({
            data: {
                data: {
                    user: {
                        name: 'Someone',
                        contributionsCollection: {
                            restrictedContributionsCount: 0,
                            contributionCalendar: {
                                weeks: [
                                    {
                                        contributionDays: [
                                            { contributionCount: 1, date: '2024-01-01' },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        });

        const data = (await fetcher.fetchContributions(1, '2024-01-01', '2024-01-01')) as UserDetails;
        expect(data.previousYearContributions).toBeUndefined();
    });
});

describe('Card.buildGraph with ghost line, trend line and private label', () => {
    const days = [
        { contributionCount: 2, date: '1' },
        { contributionCount: 1, date: '2' },
    ];

    it('renders the overlay series and private label when provided', async () => {
        const svg = await new Card(
            420,
            1200,
            0,
            fakeQueryStringRes[0].colors,
            'title',
            false,
            true,
            4,
            10,
            [
                { contributionCount: 5, date: '1' },
                { contributionCount: 6, date: '2' },
            ],
            [1.5, 1.5],
            '+42 private',
        ).buildGraph(days);

        expect(svg).toContain('ct-series-ghost');
        expect(svg).toContain('ct-series-trend');
        expect(svg).toContain('+42 private');
    });

    it('omits overlay styling and the label when none are provided', async () => {
        const svg = await new Card(
            420,
            1200,
            0,
            fakeQueryStringRes[0].colors,
            'title',
        ).buildGraph(days);

        expect(svg).not.toContain('ct-series-ghost');
        expect(svg).not.toContain('ct-series-trend');
        expect(svg).not.toContain('private');
    });
});
