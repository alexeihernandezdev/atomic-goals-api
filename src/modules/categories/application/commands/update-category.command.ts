export interface UpdateCategoryCommand {
  id: string;
  userId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}
