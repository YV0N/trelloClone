export interface TaskInterface {
  id: string;
  title: string;
  description?: string;
  userId: string;
  boardId: string;
  columnId: string;
}
