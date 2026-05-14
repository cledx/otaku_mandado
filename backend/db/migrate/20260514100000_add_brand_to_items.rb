# frozen_string_literal: true

class AddBrandToItems < ActiveRecord::Migration[8.1]
  def change
    add_column :items, :brand, :string
  end
end
