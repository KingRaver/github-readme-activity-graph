import { graphStyle } from './styles/graphStyle';
import { pointAnimation, lineAnimation } from './styles/graphAnimation';
import { GraphArgs, StreakArgs } from './interfaces/interface';

export const graphSvg = (props: GraphArgs) => `
    <svg
        width="${props.width}"
        height="${props.height}"
        viewBox="0 0 ${props.width} ${props.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
            <rect xmlns="http://www.w3.org/2000/svg" data-testid="card_bg" id="cardBg"
            x="0" y="0" rx="${props.radius}" height="100%" stroke="#E4E2E2" fill-opacity="1"
            width="100%" fill="#${props.colors.bgColor}" stroke-opacity="1" style="stroke:#${
                props.colors.borderColor
            }; stroke-width:1;"/>

            <style>
                body {
                    font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
                }
                .header {
                    font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
                    text-align: center;
                    color: #${props.colors.titleColor ?? props.colors.color};
                    margin-top: 20px;
                }
                svg {
                    font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
                    user-select: none;
                }
                ${graphStyle(
                    props.colors.color,
                    props.colors.lineColor,
                    props.colors.pointColor,
                    props.colors.areaColor,
                    props.lineWidth,
                    props.pointSize,
                )}${props.extraStyle ?? ''}
                ${pointAnimation()}
                ${lineAnimation()}
            </style>

            <foreignObject x="0" y="0" width="${props.width}" height="50">
                <h1 xmlns="http://www.w3.org/1999/xhtml" class="header">
                    ${props.title}
                </h1>
            </foreignObject>${
                props.privateLabel
                    ? `
            <text x="${props.width - 20}" y="20" text-anchor="end" data-testid="private_label" style="fill:#${props.colors.titleColor ?? props.colors.color}; opacity:.7; font-size:12px;">${props.privateLabel}</text>`
                    : ''
            }
            ${props.line}
    </svg>
`;

export const streakSvg = (props: StreakArgs) => {
    const columnWidth = props.width / 3;
    const titleColor = props.colors.titleColor ?? props.colors.color;
    const stats: Array<{ label: string; value: number }> = [
        { label: 'Total Contributions', value: props.totalContributions },
        { label: 'Current Streak', value: props.currentStreak },
        { label: 'Longest Streak', value: props.longestStreak },
    ];

    const columns = stats
        .map(
            (stat, index) => `
            <g transform="translate(${columnWidth * index + columnWidth / 2}, 0)">
                <text x="0" y="115" text-anchor="middle" data-testid="streak_value_${index}"
                    style="fill:#${props.colors.color}; font-size:36px; font-weight:700;">${stat.value}</text>
                <text x="0" y="140" text-anchor="middle" data-testid="streak_label_${index}"
                    style="fill:#${titleColor}; opacity:.75; font-size:13px;">${stat.label}</text>
            </g>`,
        )
        .join('');

    const dividers = [1, 2]
        .map(
            (i) => `
            <line x1="${columnWidth * i}" y1="65" x2="${columnWidth * i}" y2="150"
                style="stroke:#${props.colors.borderColor}; stroke-width:1; opacity:.5;"/>`,
        )
        .join('');

    return `
    <svg
        width="${props.width}"
        height="${props.height}"
        viewBox="0 0 ${props.width} ${props.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
            <rect xmlns="http://www.w3.org/2000/svg" data-testid="card_bg" id="cardBg"
            x="0" y="0" rx="${props.radius}" height="100%" stroke="#E4E2E2" fill-opacity="1"
            width="100%" fill="#${props.colors.bgColor}" stroke-opacity="1" style="stroke:#${
                props.colors.borderColor
            }; stroke-width:1;"/>

            <style>
                body {
                    font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
                }
                .header {
                    font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
                    text-align: center;
                    color: #${titleColor};
                    margin-top: 20px;
                }
                svg {
                    font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
                    user-select: none;
                }
            </style>

            <foreignObject x="0" y="0" width="${props.width}" height="50">
                <h1 xmlns="http://www.w3.org/1999/xhtml" class="header">
                    ${props.title}
                </h1>
            </foreignObject>
            ${dividers}
            ${columns}
    </svg>
`;
};

export const invalidUserSvg = (data: string) => `
    <svg
        width="400"
        height="200"
        viewBox="0 0 420 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <style>
                svg {
                    font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif;
                }
        </style>
        <rect xmlns="http://www.w3.org/2000/svg" data-testid="card_bg" id="cardBg" x="0.5"
        y="0.5" rx="4.5" height="100%" stroke="#E4E2E2" fill-opacity="1" width="100%"
        fill="#44475a" stroke-opacity="1"/>
        <text x="20" y="100" fill="#bd93f9">${data}</text>
    </svg>
`;
