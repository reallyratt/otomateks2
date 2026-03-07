export function chunkText(text: string, maxLength: number = 130): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let targetIndex = currentIndex + maxLength;

    if (targetIndex >= text.length) {
      chunks.push(text.substring(currentIndex).trim());
      break;
    }

    // Move backward from targetIndex until a space is found
    let safeIndex = targetIndex;
    while (safeIndex > currentIndex && text[safeIndex] !== ' ') {
      safeIndex--;
    }

    // If no space is found, we have to force a cut at targetIndex (fallback)
    if (safeIndex === currentIndex) {
      safeIndex = targetIndex;
    }

    const chunk = text.substring(currentIndex, safeIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    currentIndex = safeIndex + 1;
  }

  return chunks;
}
