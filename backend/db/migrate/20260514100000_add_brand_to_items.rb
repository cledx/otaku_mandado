# frozen_string_literal: true

# Brand filled by AI metadata service or manual edit.
class AddBrandToItems < ActiveRecord::Migration[8.1]
  def change
    add_column :items, :brand, :string
  end
end
