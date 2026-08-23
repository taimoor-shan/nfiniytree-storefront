import { Table } from "@medusajs/ui"

/**
 * Skeleton for PreviewItemRow — the checkout summary's compact 3-cell row.
 */
const SkeletonPreviewItem = () => {
  return (
    <Table.Row>
      <Table.Cell className="p-4 w-16">
        <div className="w-16 h-16 bg-gray-200 animate-pulse" />
      </Table.Cell>
      <Table.Cell className="text-left">
        <div className="flex flex-col gap-y-2">
          <div className="w-32 h-4 bg-gray-200 animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col gap-y-2 items-end">
          <div className="w-24 h-4 bg-gray-200 animate-pulse" />
          <div className="w-12 h-4 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default SkeletonPreviewItem
