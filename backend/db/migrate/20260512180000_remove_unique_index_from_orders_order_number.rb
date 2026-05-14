# frozen_string_literal: true

class RemoveUniqueIndexFromOrdersOrderNumber < ActiveRecord::Migration[8.1]
  def up
    existing = connection.indexes(:orders).find { |i| i.name == "index_orders_on_order_number" }
    return unless existing&.unique

    remove_index :orders, name: "index_orders_on_order_number"
    add_index :orders, :order_number, name: "index_orders_on_order_number"
  end

  def down
    remove_index :orders, name: "index_orders_on_order_number" if index_exists?(:orders, :order_number, name: "index_orders_on_order_number")
    add_index :orders, :order_number, name: "index_orders_on_order_number", unique: true
  end
end
