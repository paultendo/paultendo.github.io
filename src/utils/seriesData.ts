export interface Series {
  id: string;
  title: string;
  posts: string[];
}

export const SERIES: Series[] = [
  {
    id: "unicode-identifier-security",
    title: "Unicode identifier security",
    posts: [
      "unicode-confusables-nfkc-conflict",
      "confusable-detection-without-nfkc",
      "unicode-identifier-threat-model",
      "making-unicode-risk-measurable",
      "confusable-vision-visual-similarity",
      "confusable-vision-novel-discoveries",
      "confusable-vision-cjk-hangul-scan",
      "confusable-llm-attack-vectors",
      "confusable-vision-llm-attack-tests",
      "confusable-vision-size-ratio",
      "confusable-vision-pipeline-148x",
      "anglocentric-confusable-detection",
      "confusable-vision-cross-script",
      "font-specific-confusable-maps",
    ],
  },
];

export function getSeriesForPost(postId: string) {
  for (const series of SERIES) {
    const index = series.posts.indexOf(postId);
    if (index !== -1) {
      return { series, index };
    }
  }
  return null;
}
