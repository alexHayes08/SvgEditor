// import NodeHelper from '../helpers/node-helper';

/**
 * All SVG types must be implement this interface.
 */
export default interface ISvgType {
    isType(node: Attr|Element): boolean;
    readonly name: string;
}