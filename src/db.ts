import Database from 'better-sqlite3';
import { Note, Folder, Tag } from './types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'notes.db');

export class NotesDB {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.init();
  }

  private init() {
    // 创建笔记表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT UNIQUE NOT NULL,
        content TEXT NOT NULL,
        folder TEXT,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
        dueDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // 创建文件夹表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // 创建标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        noteId INTEGER NOT NULL,
        FOREIGN KEY(noteId) REFERENCES notes(id) ON DELETE CASCADE,
        UNIQUE(name, noteId)
      )
    `);

    // 启用外键约束
    this.db.exec('PRAGMA foreign_keys = ON');
  }

  // 笔记相关方法
  createNote(note: Omit<Note, 'id'>): Note {
    const stmt = this.db.prepare(`
      INSERT INTO notes (title, content, folder, priority, dueDate, createdAt, updatedAt)
      VALUES (@title, @content, @folder, @priority, @dueDate, @createdAt, @updatedAt)
    `);
    
    const result = stmt.run(note);
    return { ...note, id: result.lastInsertRowid as number };
  }

  getNote(id: number): Note | undefined {
    const note = this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note;
    if (note) {
      note.tags = this.getNoteTags(id);
    }
    return note;
  }

  getNoteByTitle(title: string): Note | undefined {
    const note = this.db.prepare('SELECT * FROM notes WHERE title = ?').get(title) as Note;
    if (note) {
      note.tags = this.getNoteTags(note.id);
    }
    return note;
  }

  updateNote(id: number, updates: Partial<Note>): boolean {
    const sets = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'tags')
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = this.db.prepare(`UPDATE notes SET ${sets} WHERE id = @id`);
    const result = stmt.run({ ...updates, id });
    return result.changes > 0;
  }

  deleteNote(id: number): boolean {
    const result = this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // 标签相关方法
  private getNoteTags(noteId: number): string[] {
    return this.db.prepare('SELECT name FROM tags WHERE noteId = ?')
      .all(noteId)
      .map(row => (row as { name: string }).name);
  }

  addTag(noteId: number, tag: string): void {
    this.db.prepare('INSERT OR IGNORE INTO tags (name, noteId) VALUES (?, ?)')
      .run(tag, noteId);
  }

  removeTags(noteId: number, tags: string[]): void {
    const placeholders = tags.map(() => '?').join(',');
    this.db.prepare(`DELETE FROM tags WHERE noteId = ? AND name IN (${placeholders})`)
      .run(noteId, ...tags);
  }

  // 文件夹相关方法
  createFolder(name: string): Folder {
    const now = new Date().toISOString();
    const result = this.db.prepare(
      'INSERT INTO folders (name, createdAt) VALUES (?, ?)'
    ).run(name, now);
    
    return {
      id: result.lastInsertRowid as number,
      name,
      createdAt: now
    };
  }

  // 搜索方法
  searchNotes(options: {
    query: string;
    searchIn?: ('title' | 'content' | 'tags')[];
    folder?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Note[] {
    let sql = 'SELECT DISTINCT n.* FROM notes n';
    const params: any[] = [];
    
    if (options.searchIn?.includes('tags')) {
      sql += ' LEFT JOIN tags t ON n.id = t.noteId';
    }
    
    const conditions: string[] = [];
    if (options.query) {
      const searchFields = options.searchIn || ['title', 'content'];
      const fieldConditions = searchFields.map(field => {
        if (field === 'tags') {
          params.push(`%${options.query}%`);
          return 't.name LIKE ?';
        } else {
          params.push(`%${options.query}%`);
          return `n.${field} LIKE ?`;
        }
      });
      conditions.push(`(${fieldConditions.join(' OR ')})`);
    }
    
    if (options.folder) {
      conditions.push('n.folder = ?');
      params.push(options.folder);
    }
    
    if (options.priority) {
      conditions.push('n.priority = ?');
      params.push(options.priority);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY n.updatedAt DESC';
    
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }
    
    const notes = this.db.prepare(sql).all(...params) as Note[];
    return notes.map(note => ({
      ...note,
      tags: this.getNoteTags(note.id)
    }));
  }
}
