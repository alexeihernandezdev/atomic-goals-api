export interface CreateCategoryCommand {
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}
