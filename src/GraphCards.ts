import { createGraph } from './createChart';
import { graphSvg } from './svgs';
import { DEFAULT_LINE_WIDTH, DEFAULT_POINT_SIZE, overlaySeriesStyle } from './styles/graphStyle';
import { Colors, ContributionDay, GraphArgs } from './interfaces/interface';

export class Card {
    constructor(
        private readonly height: number,
        private readonly width: number,
        private readonly radius: number,
        private readonly colors: Colors,
        private readonly title = '',
        private readonly area = false,
        private readonly showGrid = true,
        private readonly lineWidth = DEFAULT_LINE_WIDTH,
        private readonly pointSize = DEFAULT_POINT_SIZE,
        // Same window, one year earlier (compare=year) - rendered as a secondary "ghost" line
        private readonly ghostContributions?: ContributionDay[],
        // 7-day moving average (trend=true), aligned day-for-day with `days`
        private readonly trendValues?: number[],
        // "+N private" label (show_private=true)
        private readonly privateLabel?: string,
    ) {}

    private getOptions() {
        return {
            width: this.width,
            height: this.height,
            axisY: {
                title: 'Contributions',
                onlyInteger: true,
                offset: 70,
                labelOffset: {
                    y: 4.5,
                },
                low: 0,
                showGrid: this.showGrid,
            },
            axisX: {
                title: 'Days',
                offset: 50,
                labelOffset: {
                    x: -4.5,
                },
                showGrid: this.showGrid,
            },
            chartPadding: {
                top: 80,
                right: 50,
                bottom: 20,
                left: 20,
            },
            showArea: this.area,
            fullWidth: true,
            // the ghost/trend lines never show points or an area fill, regardless of `area`
            series: {
                ghost: { showPoint: false, showArea: false },
                trend: { showPoint: false, showArea: false },
            },
        };
    }

    /** Unused Code ref #85 */
    // private getContrubutionDates() {
    //     const days = [];
    //     for (const date = new Date(); days.length < 31; date.setDate(date.getUTCDate() - 1)) {
    //         const current = new Date(date);
    //         days.push(
    //             current.toLocaleString('default', { month: 'short' }) +
    //                 ' ' +
    //                 current.getUTCDate().toString()
    //         );
    //     }

    //     return days.reverse();
    // }

    async buildGraph(days: ContributionDay[]): Promise<string> {
        //Options to pass in createGraph function
        const options = this.getOptions();

        const series: Array<{ value: number[]; name?: string; className?: string }> = [
            { value: days.map((day) => day.contributionCount) },
        ];
        const hasGhost = !!this.ghostContributions?.length;
        const hasTrend = !!this.trendValues?.length;
        if (hasGhost) {
            series.push({
                value: this.ghostContributions!.map((day) => day.contributionCount),
                name: 'ghost',
                className: 'ct-series-ghost',
            });
        }
        if (hasTrend) {
            series.push({ value: this.trendValues!, name: 'trend', className: 'ct-series-trend' });
        }

        //Construction of graph from node-chartist
        const line: Promise<string> = await createGraph('line', options, {
            labels: days.map((day) => day.date),
            series,
        });

        //Arguments to construct graphs with rect and other options
        const args: GraphArgs = {
            height: this.height,
            width: this.width,
            colors: this.colors,
            title: this.title,
            radius: this.radius,
            line,
            lineWidth: this.lineWidth,
            pointSize: this.pointSize,
        };
        if (hasGhost || hasTrend) {
            args.extraStyle = overlaySeriesStyle(this.colors.lineColor);
        }
        if (this.privateLabel) {
            args.privateLabel = this.privateLabel;
        }

        return graphSvg(args);
    }
}
