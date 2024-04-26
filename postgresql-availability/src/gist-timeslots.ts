/* ---------- TimeSlot ---------- */
import dayjs from 'dayjs'

export class TimeSlot {
  constructor(
    public date_range: [Date, Date],
    public resourceId: number,
    public requesterId: string,
    public id?: number,
  ) {}

  isOverlapping(from: Date, to: Date): boolean {
    // Check if there is any overlap between [from, to] and the time slot
    return dayjs(from).isBefore(this.date_range[1]) && dayjs(to).isAfter(this.date_range[0])
  }

  canBeUnlockedBy(requesterId: string): boolean {
    return this.requesterId === requesterId
  }
}

/* ---------- TimeAvailability ---------- */
export class TimeAvailability {
  constructor(private resourceId: number) {}

  Lock(requesterId: string, from: Date, to: Date) {
    return new TimeSlot([from, to], this.resourceId, requesterId)
  }
}
