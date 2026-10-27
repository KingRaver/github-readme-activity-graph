export class Query {
    query: string;
    variables: {
        LOGIN: string;
    };
}

export class Colors {
    areaColor: string;
    bgColor: string;
    borderColor: string;
    color: string;
    titleColor: string;
    lineColor: string;
    pointColor: string;
}

export class QueryOption {
    username: string;
    hide_title?: boolean;
    custom_title?: string;
    from?: string;
    to?: string;
    grid: boolean;
    colors: Colors;
    area: boolean;
    radius: number;
    height: number;
    days: number;
    line_width: number;
    point_size: number;
    show_private: boolean;
    compare: boolean;
    trend: boolean;
}

export class ParsedQs {
    username?: string;
    hide_title?: boolean;
    custom_title?: string;
    bg_color?: string;
    border_color?: string;
    hide_border?: boolean;
    area_color?: string;
    color?: string;
    line?: string;
    point?: string;
    theme?: string;
    area?: boolean;
    radius?: number;
    title_color?: string;
    height?: number;
    days?: string;
    from?: string;
    to?: string;
    grid?: string;
    line_width?: string;
    point_size?: string;
    show_private?: string;
    compare?: string;
    trend?: string;
}

export class GraphArgs {
    height: number;
    width: number;
    colors: Colors;
    title: string;
    radius: number;
    line: Promise<string>;
    lineWidth?: number;
    pointSize?: number;
    extraStyle?: string;
    privateLabel?: string;
}

export class UserDetails {
    contributions: Array<ContributionDay>;
    name: string;
    restrictedContributionsCount?: number;
    previousYearContributions?: Array<ContributionDay>;
}

export class ContributionDay {
    contributionCount: number;
    date: string;
}

export class Week {
    contributionDays: Array<ContributionDay>;
}

export class StreakArgs {
    height: number;
    width: number;
    colors: Colors;
    title: string;
    radius: number;
    currentStreak: number;
    longestStreak: number;
    totalContributions: number;
}

export class StreakData {
    name: string;
    currentStreak: number;
    longestStreak: number;
    totalContributions: number;
}

export interface YearlyContribution {
    contributionsCollection: {
        contributionCalendar: {
            weeks: Array<Week>;
        };
    };
}

export class StreakQueryResponse {
    data?: Record<string, YearlyContribution>;
    errors?: Array<{ message: string; type: string }>;
}

export class CreatedAtApiResponse {
    data?: {
        user: {
            name: string;
            createdAt: string;
        } | null;
    };
    errors?: Array<{ message: string; type: string }>;
}

export class ResponseOfApi {
    data?: {
        user: {
            name: string;
            contributionsCollection: {
                restrictedContributionsCount?: number;
                contributionCalendar: {
                    totalContributions: number;
                    weeks: Array<Week>;
                };
            };
        };
        userPrevious?: {
            contributionsCollection: {
                contributionCalendar: {
                    weeks: Array<Week>;
                };
            };
        };
    };
    errors?: Array<{ message: string; type: string }>;
}
