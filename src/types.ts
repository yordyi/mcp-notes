export interface Note {
  id: number;
  title: string;
  content: string;
  folder?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: number;
  name: string;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  noteId: number;
}

export interface SearchOptions {
  query: string;
  searchIn?: ('title' | 'content' | 'tags')[];
  folder?: string;
  priority?: 'low' | 'medium' | 'high';
  hasDueDate?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
