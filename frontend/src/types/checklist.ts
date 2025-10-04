export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

export interface ChecklistData {
  id: string;
  userId: string;
  generatedAt: string;
  categories: ChecklistCategory[];
}
