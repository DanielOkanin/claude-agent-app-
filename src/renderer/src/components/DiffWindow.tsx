import { useState, useEffect, useRef, useMemo } from 'react'

interface DiffData {
  filePath: string
  oldContent: string
  newContent: string
  cwd: string
  allFiles: string[]
}

interface DiffLine {
  oldNum: number | null
  newNum: number | null
  oldText: string
  newText: string
  type: 'unchanged' | 'modified' | 'added' | 'removed'
}

function computeSideBySideDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based diff
  const m = oldLines.length
  const n = newLines.length

  // Build LCS table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find diff
  const diffs: { type: 'unchanged' | 'added' | 'removed'; oldIdx?: number; newIdx?: number }[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffs.unshift({ type: 'unchanged', oldIdx: i - 1, newIdx: j - 1 })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.unshift({ type: 'added', newIdx: j - 1 })
      j--
    } else {
      diffs.unshift({ type: 'removed', oldIdx: i - 1 })
      i--
    }
  }

  // Convert to side-by-side lines, pairing removes with adds
  let idx = 0
  while (idx < diffs.length) {
    const d = diffs[idx]
    if (d.type === 'unchanged') {
      result.push({
        oldNum: d.oldIdx! + 1,
        newNum: d.newIdx! + 1,
        oldText: oldLines[d.oldIdx!],
        newText: newLines[d.newIdx!],
        type: 'unchanged'
      })
      idx++
    } else if (d.type === 'removed') {
      // Collect consecutive removes
      const removes: number[] = []
      while (idx < diffs.length && diffs[idx].type === 'removed') {
        removes.push(diffs[idx].oldIdx!)
        idx++
      }
      // Collect consecutive adds
      const adds: number[] = []
      while (idx < diffs.length && diffs[idx].type === 'added') {
        adds.push(diffs[idx].newIdx!)
        idx++
      }
      // Pair them
      const maxLen = Math.max(removes.length, adds.length)
      for (let k = 0; k < maxLen; k++) {
        const hasRemove = k < removes.length
        const hasAdd = k < adds.length
        result.push({
          oldNum: hasRemove ? removes[k] + 1 : null,
          newNum: hasAdd ? adds[k] + 1 : null,
          oldText: hasRemove ? oldLines[removes[k]] : '',
          newText: hasAdd ? newLines[adds[k]] : '',
          type: hasRemove && hasAdd ? 'modified' : hasRemove ? 'removed' : 'added'
        })
      }
    } else {
      // Standalone add (shouldn't happen often due to pairing above)
      result.push({
        oldNum: null,
        newNum: d.newIdx! + 1,
        oldText: '',
        newText: newLines[d.newIdx!],
        type: 'added'
      })
      idx++
    }
  }

  return result
}

function DiffPane({ lines, side }: { lines: DiffLine[]; side: 'old' | 'new' }) {
  return (
    <div style={{ fontFamily: "'SF Mono', 'Fira Code', Menlo, monospace", fontSize: 12, lineHeight: '22px' }}>
      {lines.map((line, i) => {
        const num = side === 'old' ? line.oldNum : line.newNum
        const text = side === 'old' ? line.oldText : line.newText
        const isEmpty = (side === 'old' && line.type === 'added') || (side === 'new' && line.type === 'removed')
        const isChanged = line.type === 'modified' || (side === 'old' && line.type === 'removed') || (side === 'new' && line.type === 'added')

        let bgColor = 'transparent'
        let textColor = '#cbd5e1'
        let gutterBg = 'transparent'

        if (isEmpty) {
          bgColor = 'rgba(51,65,85,0.15)'
          gutterBg = 'rgba(51,65,85,0.15)'
        } else if (side === 'old' && (line.type === 'removed' || line.type === 'modified')) {
          bgColor = 'rgba(248,113,113,0.08)'
          textColor = '#fca5a5'
          gutterBg = 'rgba(248,113,113,0.12)'
        } else if (side === 'new' && (line.type === 'added' || line.type === 'modified')) {
          bgColor = 'rgba(74,222,128,0.08)'
          textColor = '#86efac'
          gutterBg = 'rgba(74,222,128,0.12)'
        }

        return (
          <div key={i} style={{ display: 'flex', background: bgColor, minHeight: 22 }}>
            {/* Line number */}
            <div style={{
              width: 52,
              flexShrink: 0,
              textAlign: 'right',
              padding: '0 8px',
              color: isChanged ? (side === 'old' ? '#f87171' : '#4ade80') : '#475569',
              background: gutterBg,
              userSelect: 'none',
              fontSize: 11,
              borderRight: '1px solid rgba(51,65,85,0.3)',
            }}>
              {num ?? ''}
            </div>
            {/* Code */}
            <div style={{
              flex: 1,
              padding: '0 12px',
              color: isEmpty ? 'transparent' : textColor,
              whiteSpace: 'pre',
              overflow: 'hidden',
            }}>
              {isEmpty ? '' : (text || ' ')}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DiffWindow() {
  const [data, setData] = useState<DiffData | null>(null)
  const [error, setError] = useState(false)
  const [changePositions, setChangePositions] = useState<number[]>([])
  const [currentChange, setCurrentChange] = useState(0)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Request diff data from main process (invoke = request/response, no timing issues)
    window.api.getDiffData().then((d) => {
      if (d) setData(d)
      else setError(true)
    }).catch(() => setError(true))
  }, [])

  const diffLines = useMemo(() => {
    if (!data) return []
    return computeSideBySideDiff(data.oldContent, data.newContent)
  }, [data])

  // Find change positions (line indices where changes start)
  useEffect(() => {
    const positions: number[] = []
    let inChange = false
    diffLines.forEach((line, i) => {
      const isChanged = line.type !== 'unchanged'
      if (isChanged && !inChange) {
        positions.push(i)
        inChange = true
      } else if (!isChanged) {
        inChange = false
      }
    })
    setChangePositions(positions)
    setCurrentChange(0)
  }, [diffLines])

  // Sync scroll between left and right panes
  const syncScroll = (source: 'left' | 'right') => {
    const src = source === 'left' ? leftRef.current : rightRef.current
    const dst = source === 'left' ? rightRef.current : leftRef.current
    if (src && dst) {
      dst.scrollTop = src.scrollTop
      dst.scrollLeft = src.scrollLeft
    }
  }

  const switchToFile = async (filePath: string) => {
    const newData = await window.api.switchDiffFile(filePath)
    if (newData) setData(newData)
  }

  const currentFileIndex = data ? data.allFiles.indexOf(data.filePath) : -1
  const hasPrevFile = currentFileIndex > 0
  const hasNextFile = data ? currentFileIndex < data.allFiles.length - 1 : false

  const goToChange = (index: number) => {
    // Navigate to previous file when going above first change
    if (index < 0 && hasPrevFile) {
      switchToFile(data!.allFiles[currentFileIndex - 1])
      return
    }
    // Navigate to next file when going below last change
    if (index > changePositions.length - 1 && hasNextFile) {
      switchToFile(data!.allFiles[currentFileIndex + 1])
      return
    }
    const clamped = Math.max(0, Math.min(index, changePositions.length - 1))
    setCurrentChange(clamped)
    const lineIndex = changePositions[clamped]
    const scrollTop = lineIndex * 22 - 100 // 22px per line, offset a bit
    if (leftRef.current) leftRef.current.scrollTop = scrollTop
    if (rightRef.current) rightRef.current.scrollTop = scrollTop
  }

  if (!data) {
    return (
      <div style={{ height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: error ? '#f87171' : '#64748b', fontSize: 14 }}>
        {error ? 'Failed to load diff data' : 'Loading diff...'}
      </div>
    )
  }

  const fileName = data.filePath.split('/').pop() || data.filePath
  const dirPath = data.filePath.includes('/') ? data.filePath.substring(0, data.filePath.lastIndexOf('/')) : ''

  return (
    <div style={{ height: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', color: 'white' }}>
      {/* Title bar spacer */}
      <div style={{ height: 44, flexShrink: 0, WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Toolbar */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(51,65,85,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: '#0d1526',
      }}>
        {/* File info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{fileName}</span>
          {dirPath && <span style={{ fontSize: 11, color: '#64748b' }}>{dirPath}</span>}
        </div>

        {/* Change navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {data.allFiles.length > 1 && (
            <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 500 }}>
              File {currentFileIndex + 1}/{data.allFiles.length}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {changePositions.length} {changePositions.length === 1 ? 'change' : 'changes'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => goToChange(currentChange - 1)}
              disabled={currentChange <= 0 && !hasPrevFile}
              style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.3)',
                color: currentChange <= 0 && !hasPrevFile ? '#334155' : currentChange <= 0 ? '#c084fc' : '#94a3b8',
                cursor: currentChange <= 0 && !hasPrevFile ? 'default' : 'pointer',
              }}
              title={currentChange <= 0 && hasPrevFile ? 'Previous file' : 'Previous change (↑)'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
            </button>
            <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 36, textAlign: 'center' }}>
              {changePositions.length > 0 ? `${currentChange + 1}/${changePositions.length}` : '0/0'}
            </span>
            <button
              onClick={() => goToChange(currentChange + 1)}
              disabled={currentChange >= changePositions.length - 1 && !hasNextFile}
              style={{
                width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.3)',
                color: currentChange >= changePositions.length - 1 && !hasNextFile ? '#334155' : currentChange >= changePositions.length - 1 ? '#c084fc' : '#94a3b8',
                cursor: currentChange >= changePositions.length - 1 && !hasNextFile ? 'default' : 'pointer',
              }}
              title={currentChange >= changePositions.length - 1 && hasNextFile ? 'Next file' : 'Next change (↓)'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(51,65,85,0.3)', flexShrink: 0 }}>
        <div style={{ flex: 1, padding: '6px 16px', fontSize: 11, color: '#f87171', fontWeight: 600, background: 'rgba(248,113,113,0.05)', borderRight: '1px solid rgba(51,65,85,0.3)' }}>
          Previous version
        </div>
        <div style={{ flex: 1, padding: '6px 16px', fontSize: 11, color: '#4ade80', fontWeight: 600, background: 'rgba(74,222,128,0.05)' }}>
          Current version
        </div>
      </div>

      {/* Side-by-side diff */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left pane (old) */}
        <div
          ref={leftRef}
          onScroll={() => syncScroll('left')}
          style={{ flex: 1, overflow: 'auto', borderRight: '1px solid rgba(51,65,85,0.3)' }}
        >
          <DiffPane lines={diffLines} side="old" />
        </div>
        {/* Right pane (new) */}
        <div
          ref={rightRef}
          onScroll={() => syncScroll('right')}
          style={{ flex: 1, overflow: 'auto' }}
        >
          <DiffPane lines={diffLines} side="new" />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        padding: '4px 16px',
        borderTop: '1px solid rgba(51,65,85,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 10,
        color: '#64748b',
        background: '#0d1526',
        flexShrink: 0,
      }}>
        <span>{data.filePath}</span>
        <span style={{ marginLeft: 'auto' }}>
          <span style={{ color: '#4ade80' }}>+{diffLines.filter(l => l.type === 'added' || (l.type === 'modified')).length}</span>
          {' / '}
          <span style={{ color: '#f87171' }}>−{diffLines.filter(l => l.type === 'removed' || (l.type === 'modified')).length}</span>
        </span>
      </div>
    </div>
  )
}
