// Import all hmtl files as strings.
declare module "*.html" {
    const content: string;
    export default content;
}