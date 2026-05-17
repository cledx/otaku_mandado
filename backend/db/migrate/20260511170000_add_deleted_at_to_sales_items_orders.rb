# frozen_string_literal: true

# Soft delete support (see SoftDeletable concern).
class AddDeletedAtToSalesItemsOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :sales, :deleted_at, :datetime
    add_column :items, :deleted_at, :datetime
    add_column :orders, :deleted_at, :datetime

    add_index :sales, :deleted_at
    add_index :items, :deleted_at
    add_index :orders, :deleted_at
  end
end
