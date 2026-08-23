import { Table } from "@medusajs/ui"

/**
 * Pure native-table skeleton for a 5-cell line-item row — mirrors
 * DesktopItemRow. No grid/col-start classes; below `small` the mobile card
 * skeleton (SkeletonMobileItemCard) renders instead.
 */
const SkeletonLineItem = () => {
  return (
    <Table.Row>
      <Table.Cell>
        <div className="w-24 h-24 p-4 bg-gray-200 animate-pulse" />
      </Table.Cell>
      <Table.Cell className="text-left">
        <div className="flex flex-col gap-y-2">
          <div className="w-32 h-4 bg-gray-200 animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-2 items-center">
          <div className="w-6 h-8 bg-gray-200 animate-pulse" />
          <div className="w-14 h-10 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="w-12 h-6 bg-gray-200 animate-pulse" />
      </Table.Cell>
      <Table.Cell className="text-right">
        <div className="flex justify-end">
          <div className="w-12 h-6 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default SkeletonLineItem
