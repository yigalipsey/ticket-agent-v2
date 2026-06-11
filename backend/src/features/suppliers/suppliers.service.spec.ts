import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import { SuppliersRepository } from './suppliers.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: SuppliersRepository;

  const mockRepository = {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByInternalCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    checkSlugExists: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SuppliersService(mockRepository as any);
    repository = mockRepository as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should generate a slug from nameEn if slug is not provided', async () => {
      vi.mocked(repository.checkSlugExists).mockResolvedValue(false);
      vi.mocked(repository.create).mockImplementation(async (val) => ({ id: '1', ...val }) as any);

      const dto = {
        name: 'Hebrew Name',
        nameEn: 'English Name',
        internalCode: 'ENG_API',
      };

      const result = await service.create(dto as any);

      expect(repository.checkSlugExists).toHaveBeenCalledWith('english-name', undefined);
      expect(result.slug).toBe('english-name');
    });

    it('should prioritize nameEn over name for slug generation', async () => {
      vi.mocked(repository.checkSlugExists).mockResolvedValue(false);
      vi.mocked(repository.create).mockImplementation(async (val) => ({ id: '1', ...val }) as any);

      const dto = {
        name: 'Hebrew Name',
        nameEn: 'English Name',
        internalCode: 'ENG_API',
      };

      const result = await service.create(dto as any);

      expect(repository.checkSlugExists).toHaveBeenCalledWith('english-name', undefined);
      expect(result.slug).toBe('english-name');
    });

    it('should handle slug collisions by appending a suffix', async () => {
      vi.mocked(repository.checkSlugExists)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValue(false);
      vi.mocked(repository.create).mockImplementation(async (val) => ({ id: '1', ...val }) as any);

      const dto = {
        name: 'Test',
        nameEn: 'Test',
        internalCode: 'TEST_API',
      };

      const result = await service.create(dto as any);

      expect(repository.checkSlugExists).toHaveBeenCalledTimes(3);
      expect(result.slug).toBe('test-2');
    });

    it('should throw ConflictException if max slug attempts exceeded', async () => {
      vi.mocked(repository.checkSlugExists).mockResolvedValue(true);

      const dto = {
        name: 'Test',
        nameEn: 'Test',
        internalCode: 'TEST_API',
      };

      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('should set is_active to false and populate deactivated_at', async () => {
      const existing = { id: '1', is_active: true };
      vi.mocked(repository.findById).mockResolvedValue(existing as any);
      vi.mocked(repository.update).mockResolvedValue({ ...existing, is_active: false, deactivated_at: new Date() } as any);

      const result = await service.deactivate('1');

      expect(repository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        is_active: false,
        deactivated_at: expect.any(Date)
      }));
      expect(result.is_active).toBe(false);
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.deactivate('1')).rejects.toThrow(NotFoundException);
    });

    it('should return existing if already deactivated without updating', async () => {
      const existing = { id: '1', is_active: false };
      vi.mocked(repository.findById).mockResolvedValue(existing as any);

      const result = await service.deactivate('1');

      expect(repository.update).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });
  });
});
