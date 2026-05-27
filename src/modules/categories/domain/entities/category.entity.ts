import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

interface CreateCategoryProps {
  userId: Uuid;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface ReconstituteCategoryProps {
  id: Uuid;
  userId: Uuid;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Category {
  private constructor(
    public readonly id: Uuid,
    public readonly userId: Uuid,
    private _name: string,
    private _description: string | null,
    private _color: string | null,
    private _icon: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _deletedAt: Date | null,
  ) {}

  static create(props: CreateCategoryProps): Category {
    const now = new Date();
    return new Category(
      Uuid.generate(),
      props.userId,
      props.name.trim(),
      props.description ?? null,
      props.color ?? null,
      props.icon ?? null,
      now,
      now,
      null,
    );
  }

  static reconstitute(props: ReconstituteCategoryProps): Category {
    return new Category(
      props.id,
      props.userId,
      props.name,
      props.description,
      props.color,
      props.icon,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  get name(): string {
    return this._name;
  }
  get description(): string | null {
    return this._description;
  }
  get color(): string | null {
    return this._color;
  }
  get icon(): string | null {
    return this._icon;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  update(
    name?: string,
    description?: string | null,
    color?: string | null,
    icon?: string | null,
  ): void {
    if (name !== undefined) this._name = name.trim();
    if (description !== undefined) this._description = description;
    if (color !== undefined) this._color = color;
    if (icon !== undefined) this._icon = icon;
  }

  softDelete(): void {
    this._deletedAt = new Date();
  }

  restore(): void {
    this._deletedAt = null;
  }
}
