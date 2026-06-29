import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { BranchService } from './branch.service';
import { Branch } from './entities/branch.entity';

type RepositoryMock = {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
};

function createQueryBuilderMock(result: Branch | null = null) {
    const builder = {
        withDeleted: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
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
        'orderBy',
        'skip',
        'take',
    ] as const) {
        builder[method].mockReturnValue(builder);
    }

    return builder;
}

describe('BranchService', () => {
    let service: BranchService;
    let repository: RepositoryMock;

    beforeEach(async () => {
        repository = {
            create: jest.fn((value: Partial<Branch>) => value),
            save: jest.fn((value) => Promise.resolve(value)),
            findOne: jest.fn(),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn(() => createQueryBuilderMock()),
        };

        const module = await Test.createTestingModule({
            providers: [
                BranchService,
                {
                    provide: getRepositoryToken(Branch),
                    useValue: repository as Partial<Repository<Branch>>,
                },
            ],
        }).compile();

        service = module.get(BranchService);
    });

    it('normalizes data and defaults status when creating', async () => {
        await service.create({
            code: ' it ',
            name: ' Information Technology ',
            description: ' Main office ',
        });

        expect(repository.create).toHaveBeenCalledWith({
            code: 'IT',
            name: 'Information Technology',
            description: 'Main office',
            status: true,
        });
    });

    it('rejects an existing Branch code', async () => {
        repository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock({
                code: 'IT',
                name: 'Other',
            } as Branch),
        );

        await expect(
            service.create({ code: 'IT', name: 'Information Technology' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects an empty update', async () => {
        await expect(service.update('Branch-id', {})).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('does not check uniqueness when the Branch name is unchanged', async () => {
        repository.findOne.mockResolvedValue({
            id: 'Branch-id',
            name: 'Information Technology',
        });

        await service.update('Branch-id', {
            name: ' Information Technology ',
        });

        expect(repository.createQueryBuilder).not.toHaveBeenCalled();
        expect(repository.save).toHaveBeenCalledWith({
            id: 'Branch-id',
            name: 'Information Technology',
        });
    });

    it('updates the code while excluding the current Branch from uniqueness checks', async () => {
        const queryBuilder = createQueryBuilderMock();
        repository.createQueryBuilder.mockReturnValue(queryBuilder);
        repository.findOne.mockResolvedValue({
            id: 'Branch-id',
            code: 'IT',
            name: 'Information Technology',
        });

        await service.update('Branch-id', {
            code: ' hr ',
        });

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'branch.id != :excludedId',
            { excludedId: 'Branch-id' },
        );
        expect(repository.save).toHaveBeenCalledWith({
            id: 'Branch-id',
            code: 'HR',
            name: 'Information Technology',
        });
    });

    it('does not check uniqueness when the Branch code is unchanged', async () => {
        repository.findOne.mockResolvedValue({
            id: 'Branch-id',
            code: 'IT',
            name: 'Information Technology',
        });

        await service.update('Branch-id', {
            code: ' it ',
        });

        expect(repository.createQueryBuilder).not.toHaveBeenCalled();
        expect(repository.save).toHaveBeenCalledWith({
            id: 'Branch-id',
            code: 'IT',
            name: 'Information Technology',
        });
    });

    it('hard deletes an existing Branch', async () => {
        repository.findOne.mockResolvedValue({ id: 'Branch-id' });

        await service.remove('Branch-id');

        expect(repository.delete).toHaveBeenCalledWith('Branch-id');
    });

    it('does not delete a missing Branch', async () => {
        repository.findOne.mockResolvedValue(null);

        await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion when related data exists', async () => {
        repository.findOne.mockResolvedValue({ id: 'Branch-id' });
        repository.delete.mockRejectedValue(
            new QueryFailedError('', [], {
                code: 'ER_ROW_IS_REFERENCED_2',
            } as never),
        );

        await expect(service.remove('Branch-id')).rejects.toEqual(
            new ConflictException(
                'Branch cannot be deleted because related data exists',
            ),
        );
    });
});
