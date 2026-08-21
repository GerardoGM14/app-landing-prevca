import { NotFoundError } from '../../shared/errors/app-error';
import { claimsRepository, generateClaimCode, ClaimDoc } from './claims.repository';
import { CreateClaimInput, ClaimQuery, UpdateClaimInput } from './claims.schema';

export const claimsService = {
  async list(query: ClaimQuery) {
    return claimsRepository.list(query);
  },

  async findById(id: string) {
    const claim = await claimsRepository.findById(id);
    if (!claim) throw new NotFoundError('Reclamo');
    return claim;
  },

  async findByCode(code: string) {
    const claim = await claimsRepository.findByCode(code);
    if (!claim) throw new NotFoundError('Reclamo');
    return claim;
  },

  /** Registra un reclamo del Libro de Reclamaciones (público, sin auth). */
  async create(input: CreateClaimInput) {
    const code = await generateClaimCode();

    const id = await claimsRepository.create({
      code,
      consumer: {
        fullName: input.consumer.fullName,
        documentType: input.consumer.documentType,
        documentNumber: input.consumer.documentNumber,
        address: input.consumer.address,
        phone: input.consumer.phone,
        email: input.consumer.email,
        isMinor: input.consumer.isMinor,
        guardianName: input.consumer.guardianName ?? null,
      },
      item: {
        type: input.item.type,
        amount: input.item.amount ?? null,
        description: input.item.description,
      },
      detail: {
        type: input.detail.type,
        description: input.detail.description,
        request: input.detail.request,
      },
      status: 'PENDIENTE',
      response: null,
      internalNotes: null,
    });

    return claimsService.findById(id);
  },

  async update(id: string, input: UpdateClaimInput) {
    const existing = await claimsRepository.findById(id);
    if (!existing) throw new NotFoundError('Reclamo');

    const updateData: Partial<ClaimDoc> = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.response !== undefined) updateData.response = input.response;
    if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;

    if (Object.keys(updateData).length > 0) {
      await claimsRepository.update(id, updateData);
    }
    return claimsService.findById(id);
  },
};
