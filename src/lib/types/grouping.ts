export interface GroupedData<T> {
  key: string; // raw field value (e.g., "open", "High", assigneeId)
  label: string; // display label (e.g., "Open", "High", "John Doe")
  items: T[];
}

export interface GroupableField<T> {
  id: string; // unique key for the dropdown (e.g., "status", "priority")
  label: string; // display label (e.g., "Trạng thái")
  accessor: (item: T) => string | undefined; // extract groupable value
  labelResolver?: (key: string) => string; // convert raw value -> display label
  orderMap?: Record<string, number>; // optional fixed ordering for groups
}
