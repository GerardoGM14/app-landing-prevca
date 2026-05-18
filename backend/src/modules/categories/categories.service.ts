import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { categoriesRepository, CategoryDoc } from './categories.repository';
import {
  CategoryQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './categories.schema';

export const categoriesService = {
  async list(query: CategoryQuery) {
    return categoriesRepository.list(query);
  },

  async findById(id: string) {
    const category = await categoriesRepository.findById(id);
    if (!category) throw new NotFoundError('Categoría');
    return category;
  },

  async create(input: CreateCategoryInput) {
    const conflict = await categoriesRepository.findBySlug(input.slug, input.division);
    if (conflict) {
      throw new ConflictError(`Ya existe una categoría "${input.slug}" en ${input.division}`);
    }
    const id = await categoriesRepository.create(input);
    return categoriesService.findById(id);
  },

  async update(id: string, input: UpdateCategoryInput) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) throw new NotFoundError('Categoría');

    if (input.slug && input.division) {
      const conflict = await categoriesRepository.findBySlug(input.slug, input.division);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`Ya existe una categoría "${input.slug}" en ${input.division}`);
      }
    }

    await categoriesRepository.update(id, input as Partial<CategoryDoc>);
    return categoriesService.findById(id);
  },

  async delete(id: string) {
    const existing = await categoriesRepository.findById(id);
    if (!existing) throw new NotFoundError('Categoría');
    await categoriesRepository.delete(id);
  },
};
