import { useShikiHighlighter } from "react-shiki/web"

export function useCodeHighlight(code: string, language: string = "typescript") {
  return useShikiHighlighter(code, language, "github-dark")
}
