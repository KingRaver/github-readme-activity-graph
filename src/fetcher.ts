import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import moment from 'moment';
import {
    Query,
    UserDetails,
    Week,
    ContributionDay,
    ResponseOfApi,
    StreakData,
    CreatedAtApiResponse,
    StreakQueryResponse,
} from 'src/interfaces/interface';
import { calculateStreaks } from './utils';

dotenv.config();

export class Fetcher {
    private readonly username: string;
    constructor(username: string) {
        this.username = username;
    }

    private getGraphQLQuery(from: string, to: string, previous?: { from: string; to: string }) {
        const previousYearParams = previous ? ', $FROM_PREV: DateTime!, $TO_PREV: DateTime!' : '';
        const previousYearBlock = previous
            ? `
                userPrevious: user(login: $LOGIN) {
                  contributionsCollection(from: $FROM_PREV, to: $TO_PREV) {
                    contributionCalendar {
                      weeks {
                        contributionDays {
                          contributionCount
                          date
                        }
                      }
                    }
                  }
                }`
            : '';

        return {
            query: `
              query userInfo($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!${previousYearParams}) {
                user(login: $LOGIN) {
                  name
                  contributionsCollection(from: $FROM, to: $TO) {
                    restrictedContributionsCount
                    contributionCalendar {
                      weeks {
                        contributionDays {
                          contributionCount
                          date
                        }
                      }
                    }
                  }
                }${previousYearBlock}
              }
            `,
            variables: {
                LOGIN: this.username,
                FROM: from,
                TO: to,
                ...(previous ? { FROM_PREV: previous.from, TO_PREV: previous.to } : {}),
            },
        };
    }

    private getCreatedAtQuery() {
        return {
            query: `
              query userCreatedAt($LOGIN: String!) {
                user(login: $LOGIN) {
                  name
                  createdAt
                }
              }
            `,
            variables: { LOGIN: this.username },
        };
    }

    // One aliased sub-query per calendar year, each with its own $FROM_<year>/$TO_<year> -
    // GitHub's contributionsCollection only accepts windows up to a year, so this is the
    // one-request way to cover every year since the account was created.
    private getYearlyStreakQuery(years: number[]) {
        const currentYear = moment.utc().year();

        const yearBlocks = years
            .map(
                (year) => `
                year${year}: user(login: $LOGIN) {
                  contributionsCollection(from: $FROM_${year}, to: $TO_${year}) {
                    contributionCalendar {
                      weeks {
                        contributionDays {
                          contributionCount
                          date
                        }
                      }
                    }
                  }
                }`,
            )
            .join('');

        const variableDeclarations = years
            .map((year) => `, $FROM_${year}: DateTime!, $TO_${year}: DateTime!`)
            .join('');

        const variables: { LOGIN: string; [key: string]: string } = { LOGIN: this.username };
        years.forEach((year) => {
            variables[`FROM_${year}`] = moment.utc(`${year}-01-01`).startOf('day').toISOString();
            variables[`TO_${year}`] =
                year === currentYear
                    ? moment.utc().add(1, 'days').toISOString()
                    : moment.utc(`${year}-12-31`).endOf('day').toISOString();
        });

        return {
            query: `
              query userStreak($LOGIN: String!${variableDeclarations}) {${yearBlocks}
              }
            `,
            variables,
        };
    }

    private async fetch<T = ResponseOfApi>(graphQLQuery: Query): Promise<AxiosResponse<T>> {
        return axios({
            url: 'https://api.github.com/graphql',
            method: 'POST',
            headers: {
                Authorization: `bearer ${process.env.TOKEN}`,
            },
            data: graphQLQuery,
        });
    }

    public async fetchContributions(
        days: number,
        customFromDate?: string,
        customToDate?: string,
        compareYear?: boolean,
    ): Promise<UserDetails | string> {
        let from = '',
            to = '';
        if (customFromDate && customToDate) {
            from = moment(customFromDate).utc().toISOString(true);
            to = moment(customToDate).utc().toISOString(true);
        } else {
            const now = moment();
            from = moment(now).subtract(days, 'days').utc().toISOString();
            // also include the next day in case our server is behind in time with respect to GitHub
            to = moment(now).add(1, 'days').utc().toISOString();
        }

        // Same window, one year earlier, fetched via an aliased query in the same request
        const previous = compareYear
            ? {
                  from: moment(from).subtract(1, 'year').toISOString(),
                  to: moment(to).subtract(1, 'year').toISOString(),
              }
            : undefined;

        try {
            const apiResponse = await this.fetch(this.getGraphQLQuery(from, to, previous));

            if (apiResponse.data.errors) {
                console.error('API Error: ', apiResponse.data.errors);
                if (apiResponse.data.errors[0].type === 'RATE_LIMITED') {
                    console.log('GraphQL Error: API rate limit exceeded');
                    return '💥 API rate limit exceeded. Please deploy your own instance.';
                } else {
                    return `Can't fetch any contribution. Please check your username 😬`;
                }
            } else if (apiResponse.data.data) {
                if (apiResponse.data.data.user === null)
                    return `Can't fetch any contribution. Please check your username 😬`;
                else {
                    const userData: UserDetails = {
                        contributions: [],
                        name: apiResponse.data.data.user.name,
                        restrictedContributionsCount:
                            apiResponse.data.data.user.contributionsCollection
                                .restrictedContributionsCount,
                    };
                    //filtering the week data from API response
                    const weeks =
                        apiResponse.data.data.user.contributionsCollection.contributionCalendar
                            .weeks;
                    // get day-contribution data
                    weeks.map((week: Week) =>
                        week.contributionDays.map((contributionDay: ContributionDay) => {
                            contributionDay.date = moment(contributionDay.date, moment.ISO_8601)
                                .date()
                                .toString();
                            userData.contributions.push(contributionDay);
                        }),
                    );

                    // if 32nd entry is 0 means:
                    // either the day hasn't really started
                    // or the user hasn't contributed today
                    const length = userData.contributions.length;
                    if (!(customFromDate && customToDate)) {
                        if (userData.contributions[length - 1].contributionCount === 0) {
                            userData.contributions.pop();
                        }
                        const extra = userData.contributions.length - days;
                        userData.contributions.splice(0, extra);
                    }

                    if (previous && apiResponse.data.data.userPrevious) {
                        const previousYearContributions: ContributionDay[] = [];
                        apiResponse.data.data.userPrevious.contributionsCollection.contributionCalendar.weeks.map(
                            (week: Week) =>
                                week.contributionDays.map((contributionDay: ContributionDay) => {
                                    contributionDay.date = moment(
                                        contributionDay.date,
                                        moment.ISO_8601,
                                    )
                                        .date()
                                        .toString();
                                    previousYearContributions.push(contributionDay);
                                }),
                        );
                        // align the ghost line's length to the current window's
                        const extra =
                            previousYearContributions.length - userData.contributions.length;
                        if (extra > 0) previousYearContributions.splice(0, extra);
                        userData.previousYearContributions = previousYearContributions;
                    }

                    return userData;
                }
            } else {
                console.error('Unexpected API response structure');
                throw new Error('Unexpected API response structure');
            }
        } catch (error) {
            console.log('error: ', error);
            return `Can't fetch any contribution. Please check your username 😬`;
        }
    }

    public async fetchStreakData(): Promise<StreakData | string> {
        try {
            const createdAtResponse = await this.fetch<CreatedAtApiResponse>(
                this.getCreatedAtQuery(),
            );

            if (createdAtResponse.data.errors) {
                console.error('API Error: ', createdAtResponse.data.errors);
                return `Can't fetch any contribution. Please check your username 😬`;
            }

            const user = createdAtResponse.data.data?.user;
            if (!user) {
                return `Can't fetch any contribution. Please check your username 😬`;
            }

            const startYear = moment.utc(user.createdAt).year();
            const endYear = moment.utc().year();
            const years: number[] = [];
            for (let year = startYear; year <= endYear; year++) years.push(year);

            const streakResponse = await this.fetch<StreakQueryResponse>(
                this.getYearlyStreakQuery(years),
            );

            if (streakResponse.data.errors) {
                console.error('API Error: ', streakResponse.data.errors);
                return `Can't fetch any contribution. Please check your username 😬`;
            }

            const yearlyData = streakResponse.data.data;
            if (!yearlyData) {
                return `Can't fetch any contribution. Please check your username 😬`;
            }

            // Flatten every year's weeks, in year order, into one chronological run of days.
            const allDays: ContributionDay[] = [];
            years.forEach((year) => {
                const weeks =
                    yearlyData[`year${year}`].contributionsCollection.contributionCalendar.weeks;
                weeks.map((week: Week) =>
                    week.contributionDays.map((day: ContributionDay) => allDays.push(day)),
                );
            });

            const { currentStreak, longestStreak, totalContributions } = calculateStreaks(allDays);

            return {
                name: user.name,
                currentStreak,
                longestStreak,
                totalContributions,
            };
        } catch (error) {
            console.log('error: ', error);
            return `Can't fetch any contribution. Please check your username 😬`;
        }
    }
}
