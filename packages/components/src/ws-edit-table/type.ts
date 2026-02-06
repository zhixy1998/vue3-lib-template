export interface Column {
    title: string
    dataIndex: string
    key: string
    width?: number
    canDel?: boolean
    printTitle?: string
    locate?: string
    noEdit?: boolean // 列是否可编辑
    customCell?: (record: any, index: number) => any

    [key: string]: any
}

export interface DataItem {
    key: string

    [key: string]: any
}

export interface SelectionPoint {
    rowKey: string | null
    colKey: string | null
}

export interface EditingCell {
    rowKey: string | null
    colKey: string | null
    value: string
}
