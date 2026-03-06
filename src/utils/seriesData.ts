export interface SeriesPost {
  id: string;
  label?: string;
}

export interface Series {
  id: string;
  title: string;
  posts: SeriesPost[];
}

export const SERIES: Series[] = [
  {
    id: "unicode-identifier-security",
    title: "Unicode identifier security",
    posts: [
      { id: "unicode-confusables-nfkc-conflict", label: "NFKC/confusables.txt conflicts" },
      { id: "confusable-detection-without-nfkc", label: "two confusable maps, not one" },
      { id: "unicode-identifier-threat-model", label: "threat model" },
      { id: "making-unicode-risk-measurable", label: "research motivation" },
      { id: "confusable-vision-visual-similarity", label: "SSIM + pHash methodology" },
      { id: "confusable-vision-novel-discoveries", label: "novel confusable pairs" },
      { id: "confusable-vision-cjk-hangul-scan", label: "CJK and Hangul scan" },
      { id: "confusable-llm-attack-vectors", label: "LLM attack surface" },
      { id: "confusable-vision-llm-attack-tests", label: "billing attack tests" },
      { id: "confusable-vision-size-ratio", label: "size-ratio filtering" },
      { id: "confusable-vision-pipeline-148x", label: "performance work" },
      { id: "anglocentric-confusable-detection", label: "coverage gaps" },
      { id: "confusable-vision-cross-script", label: "cross-script scanning" },
      { id: "font-specific-confusable-maps", label: "per-font confusable weights" },
      { id: "multichar-confusables", label: "multi-character confusable pairs" },
      { id: "rayspace-methodology", label: "geometric raycasting replaces SSIM and SDF" },
      { id: "rayspace-prior-art", label: "lineage from CT scanners to confusable detection" },
      { id: "idn-relevance", label: "IDN relevance filtering" },
    ],
  },
];

export function getSeriesForPost(postId: string) {
  for (const series of SERIES) {
    const index = series.posts.findIndex((p) => p.id === postId);
    if (index !== -1) {
      return { series, index };
    }
  }
  return null;
}
