# frozen_string_literal: true

class AddMxPriceToItems < ActiveRecord::Migration[8.1]
  def change
    add_column :items, :mx_price, :float
  end
end
