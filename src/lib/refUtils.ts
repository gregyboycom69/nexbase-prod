export function isRefField(field: any): boolean {
  return field?.type === 'Ref' && !!field?.refTable
}
