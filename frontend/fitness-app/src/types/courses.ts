export interface CourseIn {
    type: string,
    description: string,
    n_accesses: number,
    cost: number,
    duration_month: number,
    require_subscription: boolean
}

export interface CourseOut {
    id: number,
    type: string,
    description: string,
    n_accesses: number,
    cost: number,
    duration_month: number,
    require_subscription: boolean
}