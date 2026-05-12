# frozen_string_literal: true

class RemoveUniqueIndexFromOrdersOrderNumber < ActiveRecord::Migration[8.1]
  def change
    remove_index :orders, name: "index_orders_on_order_number"
    add_index :orders, :order_number, name: "index_orders_on_order_number"
  end
end
