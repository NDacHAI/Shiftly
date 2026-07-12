import { CreateLeaveRequestDto } from './create-leave-request.dto';

export class UpdateLeaveRequestDto implements Partial<CreateLeaveRequestDto> {
    branchId?: CreateLeaveRequestDto['branchId'];
    requestMode?: CreateLeaveRequestDto['requestMode'];
    startDate?: CreateLeaveRequestDto['startDate'];
    endDate?: CreateLeaveRequestDto['endDate'];
    isFullDay?: CreateLeaveRequestDto['isFullDay'];
    startTime?: CreateLeaveRequestDto['startTime'];
    endTime?: CreateLeaveRequestDto['endTime'];
    workScheduleIds?: CreateLeaveRequestDto['workScheduleIds'];
    reason?: CreateLeaveRequestDto['reason'];
}
