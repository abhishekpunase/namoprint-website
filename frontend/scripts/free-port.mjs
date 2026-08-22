/**
 * Free a TCP port before Vite starts (avoids "Port 5173 is already in use").
 * Windows: netstat + taskkill. Unix: lsof/fuser fallback.
 */
import { execSync } from 'node:child_process'
import process from 'node:process'

const port = Number(process.argv[2] || 5173)

function unique(list) {
  return [...new Set(list.filter(Boolean))]
}

function pidsOnWindows(p) {
  try {
    const out = execSync(`netstat -ano | findstr :${p}`, { encoding: 'utf8' })
    return unique(
      out
        .split(/\r?\n/)
        .filter((line) => /LISTENING/i.test(line))
        .map((line) => {
          const parts = line.trim().split(/\s+/)
          return parts[parts.length - 1]
        })
        .filter((pid) => /^\d+$/.test(pid) && pid !== '0'),
    )
  } catch {
    return []
  }
}

function pidsOnUnix(p) {
  try {
    const out = execSync(`lsof -ti tcp:${p} -sTCP:LISTEN`, { encoding: 'utf8' })
    return unique(out.split(/\s+/).filter((pid) => /^\d+$/.test(pid)))
  } catch {
    return []
  }
}

const isWin = process.platform === 'win32'
const pids = isWin ? pidsOnWindows(port) : pidsOnUnix(port)

if (!pids.length) {
  process.exit(0)
}

for (const pid of pids) {
  try {
    if (isWin) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
    }
    console.log(`[free-port] freed :${port} (killed pid ${pid})`)
  } catch {
    // ignore — process may have already exited
  }
}
