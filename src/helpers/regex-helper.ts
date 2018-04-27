/**
 * Only returns the matched groups of the regex.
 * @param regex 
 * @param str 
 */
export function getAllGroups(regex: RegExp, str: string): string[][] {
   let groups: string[][] = [];

   for (let group: RegExpExecArray|null = regex.exec(str)
       ; group != null
       ; group = regex.exec(str))
   {    
       // Ignore first result, it's always the entire match not the groups.
       group.shift();
       groups.push(group);
   }

   return groups;
}