#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { NotesHandlers } from './handlers.js';
import { SearchOptions } from './types.js';

interface CreateNoteArgs {
  title: string;
  content: string;
  folder?: string;
  priority?: string;
  dueDate?: string;
}

interface GetNotesArgs {
  folder?: string;
  limit?: number;
  offset?: number;
}

interface GetNoteArgs {
  title: string;
}

interface UpdateNoteArgs {
  title: string;
  content?: string;
  folder?: string;
  priority?: string;
  dueDate?: string;
}

interface DeleteNoteArgs {
  title: string;
}

interface TagsArgs {
  title: string;
  tags: string[];
}

interface CreateFolderArgs {
  name: string;
}

function validateArgs<T>(args: unknown, required: (keyof T)[]): T {
  if (typeof args !== 'object' || args === null) {
    throw new McpError(ErrorCode.InvalidParams, '参数必须是一个对象');
  }

  for (const key of required) {
    if (!(key in args)) {
      throw new McpError(ErrorCode.InvalidParams, `缺少必要参数: ${String(key)}`);
    }
  }

  return args as T;
}

class NotesServer {
  private server: Server;
  private handlers: NotesHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'notes-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.handlers = new NotesHandlers();
    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_note',
          description: '创建新的备忘录',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '备忘录标题'
              },
              content: {
                type: 'string',
                description: '备忘录内容'
              },
              folder: {
                type: 'string',
                description: '所属文件夹'
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: '优先级'
              },
              dueDate: {
                type: 'string',
                description: '截止日期 (ISO 8601格式)'
              }
            },
            required: ['title', 'content']
          }
        },
        {
          name: 'get_notes',
          description: '获取所有备忘录',
          inputSchema: {
            type: 'object',
            properties: {
              folder: {
                type: 'string',
                description: '文件夹名称'
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制'
              },
              offset: {
                type: 'number',
                description: '分页偏移量'
              }
            }
          }
        },
        {
          name: 'get_note',
          description: '获取单个备忘录详情',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '备忘录标题'
              }
            },
            required: ['title']
          }
        },
        {
          name: 'update_note',
          description: '更新备忘录',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '备忘录标题'
              },
              content: {
                type: 'string',
                description: '新的备忘录内容'
              },
              folder: {
                type: 'string',
                description: '新的所属文件夹'
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: '新的优先级'
              },
              dueDate: {
                type: 'string',
                description: '新的截止日期 (ISO 8601格式)'
              }
            },
            required: ['title']
          }
        },
        {
          name: 'delete_note',
          description: '删除备忘录',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '要删除的备忘录标题'
              }
            },
            required: ['title']
          }
        },
        {
          name: 'search_notes',
          description: '搜索备忘录',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索关键词'
              },
              searchIn: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['title', 'content', 'tags']
                },
                description: '搜索范围'
              },
              folder: {
                type: 'string',
                description: '在指定文件夹中搜索'
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: '按优先级筛选'
              },
              sortBy: {
                type: 'string',
                enum: ['createdAt', 'updatedAt', 'dueDate'],
                description: '排序字段'
              },
              sortOrder: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: '排序方向'
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制'
              },
              offset: {
                type: 'number',
                description: '分页偏移量'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'add_tags',
          description: '为备忘录添加标签',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '备忘录标题'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '要添加的标签列表'
              }
            },
            required: ['title', 'tags']
          }
        },
        {
          name: 'remove_tags',
          description: '移除备忘录的标签',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '备忘录标题'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '要移除的标签列表'
              }
            },
            required: ['title', 'tags']
          }
        },
        {
          name: 'create_folder',
          description: '创建新文件夹',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '文件夹名称'
              }
            },
            required: ['name']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!request.params.arguments) {
        throw new McpError(ErrorCode.InvalidParams, '缺少必要的参数');
      }

      const args = request.params.arguments as unknown;

      switch (request.params.name) {
        case 'create_note':
          return this.handlers.createNote(validateArgs<CreateNoteArgs>(args, ['title', 'content']));
        case 'get_notes':
          return this.handlers.getNotes(validateArgs<GetNotesArgs>(args, []));
        case 'get_note':
          return this.handlers.getNote(validateArgs<GetNoteArgs>(args, ['title']));
        case 'update_note':
          return this.handlers.updateNote(validateArgs<UpdateNoteArgs>(args, ['title']));
        case 'delete_note':
          return this.handlers.deleteNote(validateArgs<DeleteNoteArgs>(args, ['title']));
        case 'search_notes':
          return this.handlers.searchNotes(validateArgs<SearchOptions>(args, ['query']));
        case 'add_tags':
          return this.handlers.addTags(validateArgs<TagsArgs>(args, ['title', 'tags']));
        case 'remove_tags':
          return this.handlers.removeTags(validateArgs<TagsArgs>(args, ['title', 'tags']));
        case 'create_folder':
          return this.handlers.createFolder(validateArgs<CreateFolderArgs>(args, ['name']));
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `未知的工具: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Notes MCP server running on stdio');
  }
}

const server = new NotesServer();
server.run().catch(console.error);
