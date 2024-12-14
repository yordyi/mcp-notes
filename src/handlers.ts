import { NotesDB } from './db.js';
import { Note, SearchOptions } from './types.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

export class NotesHandlers {
  private db: NotesDB;

  constructor() {
    this.db = new NotesDB();
  }

  async createNote(args: { title: string; content: string; folder?: string; priority?: string; dueDate?: string }) {
    try {
      const now = new Date().toISOString();
      const note = this.db.createNote({
        title: args.title,
        content: args.content,
        folder: args.folder,
        priority: args.priority as Note['priority'],
        dueDate: args.dueDate,
        createdAt: now,
        updatedAt: now
      });

      return {
        content: [{
          type: 'text',
          text: `成功创建笔记: ${note.title}`
        }]
      };
    } catch (err: any) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
        throw new McpError(ErrorCode.InvalidParams, '笔记标题已存在');
      }
      throw err;
    }
  }

  async getNotes(args: { folder?: string; limit?: number; offset?: number }) {
    const notes = this.db.searchNotes({
      query: '',
      folder: args.folder,
      limit: args.limit,
      offset: args.offset
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(notes, null, 2)
      }]
    };
  }

  async getNote(args: { title: string }) {
    const note = this.db.getNoteByTitle(args.title);
    if (!note) {
      throw new McpError(ErrorCode.InvalidParams, `未找到标题为 "${args.title}" 的笔记`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(note, null, 2)
      }]
    };
  }

  async updateNote(args: { title: string; content?: string; folder?: string; priority?: string; dueDate?: string }) {
    const note = this.db.getNoteByTitle(args.title);
    if (!note) {
      throw new McpError(ErrorCode.InvalidParams, `未找到标题为 "${args.title}" 的笔记`);
    }

    const updates: Partial<Note> = {
      updatedAt: new Date().toISOString()
    };

    if (args.content !== undefined) updates.content = args.content;
    if (args.folder !== undefined) updates.folder = args.folder;
    if (args.priority !== undefined) updates.priority = args.priority as Note['priority'];
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

    const success = this.db.updateNote(note.id, updates);
    if (!success) {
      throw new McpError(ErrorCode.InternalError, '更新笔记失败');
    }

    return {
      content: [{
        type: 'text',
        text: `成功更新笔记: ${args.title}`
      }]
    };
  }

  async deleteNote(args: { title: string }) {
    const note = this.db.getNoteByTitle(args.title);
    if (!note) {
      throw new McpError(ErrorCode.InvalidParams, `未找到标题为 "${args.title}" 的笔记`);
    }

    const success = this.db.deleteNote(note.id);
    if (!success) {
      throw new McpError(ErrorCode.InternalError, '删除笔记失败');
    }

    return {
      content: [{
        type: 'text',
        text: `成功删除笔记: ${args.title}`
      }]
    };
  }

  async searchNotes(args: SearchOptions) {
    const notes = this.db.searchNotes(args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(notes, null, 2)
      }]
    };
  }

  async addTags(args: { title: string; tags: string[] }) {
    const note = this.db.getNoteByTitle(args.title);
    if (!note) {
      throw new McpError(ErrorCode.InvalidParams, `未找到标题为 "${args.title}" 的笔记`);
    }

    for (const tag of args.tags) {
      this.db.addTag(note.id, tag);
    }

    return {
      content: [{
        type: 'text',
        text: `成功为笔记 "${args.title}" 添加标签: ${args.tags.join(', ')}`
      }]
    };
  }

  async removeTags(args: { title: string; tags: string[] }) {
    const note = this.db.getNoteByTitle(args.title);
    if (!note) {
      throw new McpError(ErrorCode.InvalidParams, `未找到标题为 "${args.title}" 的笔记`);
    }

    this.db.removeTags(note.id, args.tags);

    return {
      content: [{
        type: 'text',
        text: `成功从笔记 "${args.title}" 移除标签: ${args.tags.join(', ')}`
      }]
    };
  }

  async createFolder(args: { name: string }) {
    try {
      const folder = this.db.createFolder(args.name);
      return {
        content: [{
          type: 'text',
          text: `成功创建文件夹: ${folder.name}`
        }]
      };
    } catch (err: any) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
        throw new McpError(ErrorCode.InvalidParams, '文件夹名称已存在');
      }
      throw err;
    }
  }
}
