import { Utilities } from '../src/utils';
import { graphStyle } from '../src/styles/graphStyle';

const sizes = (query: Record<string, string>) => {
    const { line_width, point_size } = new Utilities({ username: 'u', ...query }).queryOptions();
    return { line_width, point_size };
};

describe('line_width and point_size', () => {
    it('keeps upstream defaults when omitted or empty', () => {
        expect(sizes({})).toEqual({ line_width: 4, point_size: 10 });
        expect(sizes({ line_width: '', point_size: '' })).toEqual({
            line_width: 4,
            point_size: 10,
        });
    });

    it('accepts in-range values', () => {
        expect(sizes({ line_width: '2', point_size: '6' })).toEqual({
            line_width: 2,
            point_size: 6,
        });
    });

    it('clamps out-of-range values', () => {
        expect(sizes({ line_width: '999', point_size: '999' })).toEqual({
            line_width: 10,
            point_size: 30,
        });
        expect(sizes({ line_width: '-5', point_size: '0' })).toEqual({
            line_width: 1,
            point_size: 1,
        });
    });

    it('falls back to defaults for non-numeric input (no CSS injection)', () => {
        const res = sizes({ line_width: '4;}</style><script>', point_size: 'NaN' });
        expect(res).toEqual({ line_width: 4, point_size: 10 });
        expect(sizes({ line_width: 'Infinity' }).line_width).toBe(4);
    });

    it('writes the values into the stylesheet', () => {
        const css = graphStyle('fff', 'fff', 'fff', 'fff', 2, 6);
        expect(css).toMatch(/\.ct-line \{[^}]*stroke-width: 2px/);
        expect(css).toMatch(/\.ct-point \{[^}]*stroke-width: 6px/);
    });

    it('defaults the stylesheet to the upstream 4px line and 10px point', () => {
        const css = graphStyle('fff', 'fff', 'fff', 'fff');
        expect(css).toMatch(/\.ct-line \{[^}]*stroke-width: 4px/);
        expect(css).toMatch(/\.ct-point \{[^}]*stroke-width: 10px/);
    });
});
