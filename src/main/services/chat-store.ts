import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { homedir } from 'os'
import type { TerminalSession } from '../types'
import { DEFAULT_MODEL } from '../types'
// DEFAULT_MODEL is 'claude-opus-4-6'

const DB_DIR = join(homedir(), '.claude-chat-app')
const DB_PATH = join(DB_DIR, 'terminals.db')

export class ChatStore {
  private db: Database.Database

  constructor() {
    mkdirSync(DB_DIR, { recursive: true })
    this.db = new Database(DB_PATH)
    this.db.pragma('journal_mode = WAL')
    this.init()
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS terminal_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        working_directory TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}'
      );
    `)

    // Migration: add model column if missing
    const columns = this.db.prepare("PRAGMA table_info(terminal_sessions)").all() as { name: string }[]
    if (!columns.some((c) => c.name === 'model')) {
      this.db.exec(`ALTER TABLE terminal_sessions ADD COLUMN model TEXT NOT NULL DEFAULT '${DEFAULT_MODEL}'`)
    }
  }

  createChat(workingDirectory: string, model?: string): TerminalSession {
    const id = uuidv4()
    const now = Date.now()
    const dirName = workingDirectory.split('/').pop() || 'terminal'
    const title = dirName
    const m = model || DEFAULT_MODEL

    this.db
      .prepare(
        `INSERT INTO terminal_sessions (id, title, created_at, updated_at, working_directory, model)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, title, now, now, workingDirectory, m)

    return { id, title, createdAt: now, updatedAt: now, workingDirectory, model: m }
  }

  listChats(): TerminalSession[] {
    const rows = this.db
      .prepare('SELECT * FROM terminal_sessions ORDER BY updated_at DESC')
      .all() as Array<{
      id: string
      title: string
      created_at: number
      updated_at: number
      working_directory: string
      model: string
    }>

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      workingDirectory: row.working_directory,
      model: row.model || DEFAULT_MODEL
    }))
  }

  deleteChat(id: string): void {
    this.db.prepare('DELETE FROM terminal_sessions WHERE id = ?').run(id)
  }

  updateTitle(id: string, title: string): void {
    this.db.prepare('UPDATE terminal_sessions SET title = ?, updated_at = ? WHERE id = ?').run(title, Date.now(), id)
  }

  getChat(id: string): TerminalSession | null {
    const row = this.db.prepare('SELECT * FROM terminal_sessions WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      workingDirectory: row.working_directory,
      model: row.model || DEFAULT_MODEL
    }
  }
}
