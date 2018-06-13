import { ColorSpaceObject } from 'd3';

/**
 * Use Number.POSITIVE_INFINITY to represent multiple colors (aka full color
 * image or a gradient). Use null to represent that no color is present
 * otherwise use a ColorSpaceObject to represent the color.
 */
export type ColorValue = ColorSpaceObject|number|null;