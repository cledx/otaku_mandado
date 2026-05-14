# frozen_string_literal: true

class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.references :item, null: false, foreign_key: true
      t.string :order_number, null: false
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :orders, :status
    add_index :orders, :order_number, name: "index_orders_on_order_number"
  end
end
