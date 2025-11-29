/**
 * Extract and clean JSON from AI response with multiple fallback strategies
 */
export function extractJSON(content: string): string {
    let jsonContent = content.trim();

    // Strategy 1: Extract from markdown code blocks
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
    } else if (jsonContent.startsWith('```')) {
        // Handle incomplete markdown blocks
        jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
    }

    // Strategy 2: Find JSON object/array boundaries
    const firstBrace = jsonContent.indexOf('{');
    const firstBracket = jsonContent.indexOf('[');

    // Determine if it's an object or array
    let startPos = -1;
    let isObject = true;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startPos = firstBrace;
        isObject = true;
    } else if (firstBracket !== -1) {
        startPos = firstBracket;
        isObject = false;
    }

    if (startPos !== -1) {
        jsonContent = jsonContent.substring(startPos);
    }

    // Strategy 3: Find last complete closing delimiter
    const lastBrace = jsonContent.lastIndexOf('}');
    const lastBracket = jsonContent.lastIndexOf(']');

    let endPos = -1;
    if (isObject && lastBrace !== -1) {
        endPos = lastBrace + 1;
    } else if (!isObject && lastBracket !== -1) {
        endPos = lastBracket + 1;
    } else {
        // Fallback: use the last available delimiter
        endPos = Math.max(lastBrace, lastBracket) + 1;
    }

    if (endPos > 0) {
        jsonContent = jsonContent.substring(0, endPos);
    }

    return jsonContent;
}

/**
 * Attempt to repair incomplete JSON
 * Handles common issues like:
 * - Missing closing quotes in strings
 * - Missing closing brackets/braces
 * - Trailing commas
 * - Unmatched brackets vs braces
 */
export function repairJSON(jsonStr: string): string {
    let repaired = jsonStr;

    // Remove trailing commas before closing brackets/braces
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // Count opening and closing delimiters
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;

    // Track delimiter stack to close in correct order
    const stack: string[] = [];
    let inString = false;
    let escapeNext = false;

    // Parse to build correct closing sequence
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (char === '{') {
            stack.push('}');
        } else if (char === '[') {
            stack.push(']');
        } else if (char === '}' || char === ']') {
            if (stack.length > 0 && stack[stack.length - 1] === char) {
                stack.pop();
            }
        }
    }

    // Add missing closures in reverse stack order
    while (stack.length > 0) {
        repaired += stack.pop();
    }

    return repaired;
}
