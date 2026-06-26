import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WorkShift } from "./entities/work-shift.entity";
import { WorkShiftController } from './work-shift.controller';
import { WorkShiftService } from './work-shift.service';
import { AuthModule } from "../auth/auth.module";


@Module({
    imports: [TypeOrmModule.forFeature([WorkShift]), AuthModule],
    controllers: [WorkShiftController],
    providers: [WorkShiftService]
})

export class WorkShiftModule { }