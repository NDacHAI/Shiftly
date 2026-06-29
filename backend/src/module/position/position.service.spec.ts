import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Branch } from '../branch/entities/branch.entity';
import { Position } from './entities/position.entity';
import { PositionService } from './position.service';

type RepositoryMock = {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
};

function createQueryBuilderMock(result: Position | null = null) {
    const builder = {
        withDeleted: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        leftJoinAndSelect: jest.fn(),
        orderBy: jest.fn(),
        skip: jest.fn(),
        take: jest.fn(),
        getOne: jest.fn().mockResolvedValue(result),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    for (const method of [
        'withDeleted',
        'where',
        'andWhere',
        'leftJoinAndSelect',
        'orderBy',
        'skip',
        'take',
    ] as const) {
        builder[method].mockReturnValue(builder);
    }

    return builder;
}

describe('PositionService', () => {
    let service: PositionService;
    let positionRepository: RepositoryMock;
    let branchRepository: Pick<RepositoryMock, 'findOne'>;

    beforeEach(async () => {
        positionRepository = {
            create: jest.fn((value: Partial<Position>) => value),
            save: jest.fn((value) =>
                Promise.resolve({ id: 'position-id', ...value }),
            ),
            findOne: jest.fn(),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn(() => createQueryBuilderMock()),
        };
        branchRepository = {
            findOne: jest.fn(),
        };

        const module = await Test.createTestingModule({
            providers: [
                PositionService,
                {
                    provide: getRepositoryToken(Position),
                    useValue:
                        positionRepository as Partial<Repository<Position>>,
                },
                {
                    provide: getRepositoryToken(Branch),
                    useValue:
                        branchRepository as Partial<Repository<Branch>>,
                },
            ],
        }).compile();

        service = module.get(PositionService);
    });

    it('creates a position with normalized values and active status', async () => {
        branchRepository.findOne.mockResolvedValue({
            id: 'Branch-id',
        });
        positionRepository.findOne.mockResolvedValue({
            id: 'position-id',
        });

        await service.create({
            code: ' dev-be ',
            name: ' Backend Developer ',
            branchId: 'Branch-id',
            description: ' API development ',
        });

        expect(positionRepository.create).toHaveBeenCalledWith({
            code: 'DEV-BE',
            name: 'Backend Developer',
            branchId: 'Branch-id',
            description: 'API development',
            status: true,
        });
    });

    it('rejects a duplicate position code', async () => {
        positionRepository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock({ code: 'DEV-BE' } as Position),
        );

        await expect(
            service.create({
                code: 'DEV-BE',
                name: 'Backend Developer',
                branchId: 'Branch-id',
            }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(branchRepository.findOne).not.toHaveBeenCalled();
    });

    it('rejects creation when the Branch does not exist', async () => {
        branchRepository.findOne.mockResolvedValue(null);

        await expect(
            service.create({
                code: 'DEV-BE',
                name: 'Backend Developer',
                branchId: 'Branch-id',
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates editable fields without changing code', async () => {
        positionRepository.findOne
            .mockResolvedValueOnce({
                id: 'position-id',
                code: 'DEV-BE',
                name: 'Backend Developer',
                branchId: 'Branch-id',
                status: true,
            })
            .mockResolvedValueOnce({ id: 'position-id' });

        await service.update('position-id', {
            name: 'Senior Backend Developer',
        });

        expect(positionRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 'DEV-BE',
                name: 'Senior Backend Developer',
            }),
        );
    });

    it('updates status through the status endpoint', async () => {
        positionRepository.findOne
            .mockResolvedValueOnce({
                id: 'position-id',
                status: true,
            })
            .mockResolvedValueOnce({ id: 'position-id', status: false });

        const result = await service.updateStatus('position-id', {
            status: false,
        });

        expect(positionRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({ status: false }),
        );
        expect(result.status).toBe(false);
    });

    it('hard deletes a position without related data', async () => {
        positionRepository.findOne.mockResolvedValue({ id: 'position-id' });

        await service.remove('position-id');

        expect(positionRepository.delete).toHaveBeenCalledWith('position-id');
    });

    it('changes a referenced position to inactive instead of deleting it', async () => {
        const position = { id: 'position-id', status: true };
        positionRepository.findOne.mockResolvedValue(position);
        positionRepository.delete.mockRejectedValue(
            new QueryFailedError('', [], {
                code: 'ER_ROW_IS_REFERENCED_2',
            } as never),
        );

        await service.remove('position-id');

        expect(positionRepository.save).toHaveBeenCalledWith({
            id: 'position-id',
            status: false,
        });
    });

    it('does not delete a missing position', async () => {
        positionRepository.findOne.mockResolvedValue(null);

        await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(positionRepository.delete).not.toHaveBeenCalled();
    });
});
