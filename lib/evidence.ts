export function splitEvidence(evidence: string): { summary: string; detail?: string } {
  const toolSplit = evidence.match(
    /^(.*?)(\s+(?:lookupOrder|issueRefund|createEscalation)\([\s\S]*)$/,
  );
  if (toolSplit?.[1]?.trim() && toolSplit[2]?.trim()) {
    return { summary: toolSplit[1].trim(), detail: toolSplit[2].trim() };
  }

  const jsonSplit = evidence.match(/^(.*?)(\s*\{[\s\S]*)$/);
  if (jsonSplit?.[1]?.trim() && jsonSplit[2]?.trim() && jsonSplit[1].includes(".")) {
    return { summary: jsonSplit[1].trim(), detail: jsonSplit[2].trim() };
  }

  return { summary: evidence };
}
