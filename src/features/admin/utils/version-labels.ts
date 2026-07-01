export function compareVersionLabels(left: string, right: string) {
  const leftParts = parseVersionLabel(left);
  const rightParts = parseVersionLabel(right);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return left.localeCompare(right);
}

export function compareVersionLabelsDescending(left: string, right: string) {
  return compareVersionLabels(right, left);
}

function parseVersionLabel(version: string) {
  const normalizedVersion = version.startsWith("v") ? version.slice(1) : version;

  return normalizedVersion.split(".").map((part) => Number.parseInt(part, 10) || 0);
}
