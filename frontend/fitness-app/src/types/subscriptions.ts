export interface SubscriptionIn {
    title: string,
    cost: number,
    duration_month: number,
    weekly_accesses: number,
    description: string
}

export interface SubscriptionOut {
    id: number,
    title: string,
    cost: number,
    duration_month: number,
    weekly_accesses: number,
    description: string
}