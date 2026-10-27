export const DEFAULT_LINE_WIDTH = 4;
export const DEFAULT_POINT_SIZE = 10;

export const graphStyle = (
    color: string,
    line: string,
    point: string,
    area: string,
    lineWidth = DEFAULT_LINE_WIDTH,
    pointSize = DEFAULT_POINT_SIZE,
) =>
    `
    .ct-label {
      fill: #${color};
      color: #${color};
      font-size: .75rem;
      line-height: 1;
    }

    .ct-grid-background,
    .ct-line {
      fill: none;
    }

    .ct-chart-bar .ct-label,
    .ct-chart-line .ct-label {
      display: block;
      display: -webkit-box;
      display: -moz-box;
      display: -ms-flexbox;
      display: -webkit-flex;
      display: flex;
    }

    .ct-label.ct-horizontal.ct-start {
      -webkit-box-align: flex-end;
      -webkit-align-items: flex-end;
      -ms-flex-align: flex-end;
      align-items: flex-end;
      -webkit-box-pack: flex-start;
      -webkit-justify-content: flex-start;
      -ms-flex-pack: flex-start;
      justify-content: flex-start;
      text-align: left;
      text-anchor: start;
    }

    .ct-label.ct-horizontal.ct-end {
      -webkit-box-align: flex-start;
      -webkit-align-items: flex-start;
      -ms-flex-align: flex-start;
      align-items: flex-start;
      -webkit-box-pack: flex-start;
      -webkit-justify-content: flex-start;
      -ms-flex-pack: flex-start;
      justify-content: flex-start;
      text-align: left;
      text-anchor: start;
    }

    .ct-label.ct-vertical.ct-start {
      -webkit-box-align: flex-end;
      -webkit-align-items: flex-end;
      -ms-flex-align: flex-end;
      align-items: flex-end;
      -webkit-box-pack: flex-end;
      -webkit-justify-content: flex-end;
      -ms-flex-pack: flex-end;
      justify-content: flex-end;
      text-align: right;
      text-anchor: end;
    }

    .ct-label.ct-vertical.ct-end {
      -webkit-box-align: flex-end;
      -webkit-align-items: flex-end;
      -ms-flex-align: flex-end;
      align-items: flex-end;
      -webkit-box-pack: flex-start;
      -webkit-justify-content: flex-start;
      -ms-flex-pack: flex-start;
      justify-content: flex-start;
      text-align: left;
      text-anchor: start;
    }

    .ct-grid {
      stroke: #${color};
      stroke-width: 1px;
      stroke-opacity: 0.3;
      stroke-dasharray: 2px;
    }

    .ct-point {
      stroke-width: ${pointSize}px;
      stroke-linecap: round;
      stroke: #${point};
      animation: blink 1s ease-in-out forwards;
    }

    .ct-line {
      stroke-width: ${lineWidth}px;
      stroke-dasharray: 5000;
      stroke-dashoffset: 5000;
      stroke: #${line};
      animation: dash 5s ease-in-out forwards;
    }

    .ct-area {
      stroke: none;
      fill-opacity: 0.1;
    }

    .ct-series-a .ct-area,
    .ct-series-a .ct-slice-pie {
      fill: #${area};
    }

    .ct-label .ct-horizontal {
      transform: rotate(-90deg)
    }
    `;

// Styling for the optional year-over-year ghost line (compare=year) and
// 7-day moving average trend line (trend=true); both skip points/area so they
// stay visually secondary to the main contribution line.
export const overlaySeriesStyle = (lineColor: string) =>
    `
    .ct-series-ghost .ct-line {
      stroke: #${lineColor};
      stroke-dasharray: 6px, 4px;
      opacity: 0.35;
      animation: none;
    }

    .ct-series-trend .ct-line {
      stroke: #${lineColor};
      stroke-dasharray: 2px, 3px;
      opacity: 0.6;
      animation: none;
    }
    `;

/** Unused style for dates feature #85 */
export const diagonalTiltStyle = () => {
    return `
    .ct-label.ct-horizontal.ct-end {
      transform: rotate(-30deg);
      -webkit-transform: rotate(-30deg);
      -moz-transform: rotate(-30deg);
      -o-transform: rotate(-30deg);
      -ms-transform: rotate(-30deg);
      transform-box: fill-box;
      transform-origin: 100% 0;
      text-anchor: end;
    }
  `;
};
