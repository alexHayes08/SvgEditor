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

export function getAllGroupsV2(regex: RegExp, str: string): string[] {
    let groups: string[] = [];

    for (let group: RegExpExecArray|null = regex.exec(str)
        ; group != null
        ; group = regex.exec(str))
    {
        // Ignore the first result
        group.shift();
        groups.concat(group);
    }

    return groups;
}

export function replaceNthOccurance(str: string, regex: RegExp, replaceWith: string, occurance: number = 0): string {
    let index = 0;
    return str.replace(regex, function(match: string) {
        let result = "";

        if (index == occurance) {
            result = replaceWith;
        } else {
            result = match;
        }

        index++;
        return result;
    });
}

export function getNthOccurance(str: string, 
    regex: RegExp, 
    occurance: number = 0): RegExpExecArray 
{
    let result: RegExpExecArray|null = null;
    
    for (let index = 0, match = regex.exec(str)
        ; match != null && index <= occurance
        ; match = regex.exec(str))
    {
        if (index == occurance) {
            result = match;
            break;
        }

        index++;
    }

    if (result == null) {
        throw new Error(`Regex failed to match the ${occurance}`)
    }

    return result;
}