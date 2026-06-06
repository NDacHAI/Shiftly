import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentService } from './department.service';
import { Department } from './entities/department.entity';

type RepositoryMock = {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
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
            softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
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

    it('soft deletes an existing department', async () => {
        repository.findOne.mockResolvedValue({ id: 'department-id' });

        await service.remove('department-id');

        expect(repository.softDelete).toHaveBeenCalledWith('department-id');
    });

    it('does not delete a missing department', async () => {
        repository.findOne.mockResolvedValue(null);

        await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(repository.softDelete).not.toHaveBeenCalled();
    });
});
