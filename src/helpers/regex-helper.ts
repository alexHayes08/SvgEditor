/**
 * Used to 'reset' a RegExp object before using it. Pretty much just sets the
 * 'lastIndex' property to zero.
 * @param regex 
 */
export function resetRegexExp(regex: RegExp): void {
    regex.lastIndex = 0;
}

/**
 * Only returns the matched groups of the regex.
 * @param regex 
 * @param str 
 */
export function getAllGroups(regex: RegExp, str: string): string[][] {
    
    // Verify that the global flag is active, else this will not work
    if (!regex.global) {
        throw new Error("The global flag MUST be present.");
    }
    
    resetRegexExp(regex);
    let groups: string[][] = [];

    for (let group: RegExpExecArray|null = regex.exec(str)
       ; group != null
       ; group = regex.exec(str))
    {
        // Ignore first result, it's always the entire match not the groups.
        group.shift();
        groups.push(group);
    }

    resetRegexExp(regex);
    return groups;
}

export function getAllGroupsV2(regex: RegExp, str: string): string[] {
    
    // Verify that the global flag is active, else this will not work
    if (!regex.global) {
        throw new Error("The global flag MUST be present.");
    }
    
    resetRegexExp(regex);
    let groups: string[] = [];

    for (let group: RegExpExecArray|null = regex.exec(str)
        ; group != null
        ; group = regex.exec(str))
    {
        // Ignore the first result
        group.shift();
        groups = groups.concat(group);
    }

    resetRegexExp(regex);
    return groups;
}

export function* getAllGroupsV3(regex: RegExp, 
    str: string): IterableIterator<string[]>
{
    // let namedGroups: boolean = false
    resetRegexExp(regex);
    let groups: string[] = [];

    for (let group: RegExpExecArray|null = regex.exec(str)
        ; group != null
        ; group = regex.exec(str))
    {
        // Since RegExpExecArray ts definition doesn't contain a groups
        // property, need to cast to <any>
        // let group_any = <any>group;

        // if (namedGroups && ("groups" in group_any)) {

        //     // Return the groups obj
        //     yield group_any.groups;
        // } else {

        //     // Ignore the first result
        //     group.shift();
        //     yield group;
        // }

        // Ignore the first result.
        group.shift();

        // Return copy of the array.
        yield [...group];
    }

    resetRegexExp(regex);
}

export function replaceNthOccurance(str: string, regex: RegExp, replaceWith: string, occurance: number = 0): string {
    resetRegexExp(regex);
    let index = 0;
    let result = str.replace(regex, function(match: string) {
        let result = "";

        if (index == occurance) {
            result = replaceWith;
        } else {
            result = match;
        }

        index++;
        return result;
    });
    resetRegexExp(regex);
    return result;
}

export function getNthOccurance(str: string, 
    regex: RegExp, 
    occurance: number = 0): RegExpExecArray 
{
    resetRegexExp(regex);
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

    resetRegexExp(regex);
    return result;
}