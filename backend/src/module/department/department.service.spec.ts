import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';

type RepositoryMock = {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
};

function createQueryBuilderMock(result: Department | null = null) {
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

describe('DepartmentService', () => {
    let service: DepartmentService;
    let repository: RepositoryMock;

    beforeEach(async () => {
        repository = {
            create: jest.fn((value: Partial<Department>) => value),
            save: jest.fn((value) => Promise.resolve(value)),
            findOne: jest.fn(),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn(() => createQueryBuilderMock()),
        };

        const module = await Test.createTestingModule({
            providers: [
                DepartmentService,
                {
                    provide: getRepositoryToken(Department),
                    useValue: repository as Partial<Repository<Department>>,
                },
            ],
        }).compile();

        service = module.get(DepartmentService);
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

    it('rejects an existing department code', async () => {
        repository.createQueryBuilder.mockReturnValue(
            createQueryBuilderMock({
                code: 'IT',
                name: 'Other',
            } as Department),
        );

        await expect(
            service.create({ code: 'IT', name: 'Information Technology' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects an empty update', async () => {
        await expect(service.update('department-id', {})).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('does not check uniqueness when the department name is unchanged', async () => {
        repository.findOne.mockResolvedValue({
            id: 'department-id',
            name: 'Information Technology',
        });

        await service.update('department-id', {
            name: ' Information Technology ',
        });

        expect(repository.createQueryBuilder).not.toHaveBeenCalled();
        expect(repository.save).toHaveBeenCalledWith({
            id: 'department-id',
            name: 'Information Technology',
        });
    });

    it('updates the code while excluding the current department from uniqueness checks', async () => {
        const queryBuilder = createQueryBuilderMock();
        repository.createQueryBuilder.mockReturnValue(queryBuilder);
        repository.findOne.mockResolvedValue({
            id: 'department-id',
            code: 'IT',
            name: 'Information Technology',
        });

        await service.update('department-id', {
            code: ' hr ',
        });

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'department.id != :excludedId',
            { excludedId: 'department-id' },
        );
        expect(repository.save).toHaveBeenCalledWith({
            id: 'department-id',
            code: 'HR',
            name: 'Information Technology',
        });
    });

    it('does not check uniqueness when the department code is unchanged', async () => {
        repository.findOne.mockResolvedValue({
            id: 'department-id',
            code: 'IT',
            name: 'Information Technology',
        });

        await service.update('department-id', {
            code: ' it ',
        });

        expect(repository.createQueryBuilder).not.toHaveBeenCalled();
        expect(repository.save).toHaveBeenCalledWith({
            id: 'department-id',
            code: 'IT',
            name: 'Information Technology',
        });
    });

    it('hard deletes an existing department', async () => {
        repository.findOne.mockResolvedValue({ id: 'department-id' });

        await service.remove('department-id');

        expect(repository.delete).toHaveBeenCalledWith('department-id');
    });

    it('does not delete a missing department', async () => {
        repository.findOne.mockResolvedValue(null);

        await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(repository.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion when related data exists', async () => {
        repository.findOne.mockResolvedValue({ id: 'department-id' });
        repository.delete.mockRejectedValue(
            new QueryFailedError('', [], {
                code: 'ER_ROW_IS_REFERENCED_2',
            } as never),
        );

        await expect(service.remove('department-id')).rejects.toEqual(
            new ConflictException(
                'Department cannot be deleted because related data exists',
            ),
        );
    });
});
