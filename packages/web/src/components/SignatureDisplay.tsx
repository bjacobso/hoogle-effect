interface SignatureDisplayProps {
  signature: string
  compact?: boolean
}

// Simple syntax highlighting for type signatures
function highlightSignature(sig: string): JSX.Element[] {
  const parts: JSX.Element[] = []
  let remaining = sig
  let key = 0

  // Patterns to highlight
  const patterns: [RegExp, string][] = [
    [/^(Effect|Stream|Option|Either|Cause|Exit|Layer|Schedule|Fiber|Ref|Queue|Chunk|Array|HashMap|HashSet|Context)(?=<|[^a-zA-Z]|$)/g, 'text-blue-400 font-medium'],
    [/^(string|number|boolean|void|never|unknown|any|null|undefined)/g, 'text-green-400'],
    [/^(=>)/g, 'text-purple-400'],
    [/^(<|>|\||\&)/g, 'text-gray-400'],
    [/^(\{|\}|\(|\)|\[|\]|,|;|:)/g, 'text-gray-400'],
    [/^([A-Z][a-zA-Z0-9]*)/g, 'text-amber-400'], // Type parameters like A, E, R
  ]

  while (remaining.length > 0) {
    let matched = false

    for (const [pattern, className] of patterns) {
      pattern.lastIndex = 0
      const match = remaining.match(pattern)
      if (match && match.index === 0) {
        parts.push(
          <span key={key++} className={className}>
            {match[0]}
          </span>
        )
        remaining = remaining.slice(match[0].length)
        matched = true
        break
      }
    }

    if (!matched) {
      // Handle whitespace and other characters
      const char = remaining[0]
      if (char === ' ' || char === '\n') {
        parts.push(<span key={key++}>{char}</span>)
      } else {
        // Find the next special character or end
        const nextSpecial = remaining.slice(1).search(/[<>(){}[\],;:|&=\s]/)
        const end = nextSpecial === -1 ? remaining.length : nextSpecial + 1
        parts.push(
          <span key={key++} className="text-gray-300">
            {remaining.slice(0, end)}
          </span>
        )
        remaining = remaining.slice(end)
        continue
      }
      remaining = remaining.slice(1)
    }
  }

  return parts
}

// Simplify complex signatures for compact display
function simplifySignature(sig: string): string {
  // If it's an overloaded function, just show first overload
  if (sig.startsWith('{ ')) {
    const firstOverload = sig.match(/\{ ([^;]+);/)
    if (firstOverload) {
      return firstOverload[1].trim() + ' (+ overloads)'
    }
  }

  // Truncate very long signatures
  if (sig.length > 120) {
    return sig.slice(0, 117) + '...'
  }

  return sig
}

export function SignatureDisplay({ signature, compact }: SignatureDisplayProps) {
  const displaySig = compact ? simplifySignature(signature) : signature

  if (compact) {
    return (
      <span className="text-gray-600 dark:text-gray-400">
        {displaySig}
      </span>
    )
  }

  return (
    <code className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-all">
      {highlightSignature(displaySig)}
    </code>
  )
}
