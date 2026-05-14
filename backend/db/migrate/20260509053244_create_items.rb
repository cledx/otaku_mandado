# frozen_string_literal: true

class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.references :sale, null: false, foreign_key: true
      t.string :name
      t.float :price
      t.text :description
      t.jsonb :image, null: false, default: []
      t.string :status, null: false, default: "reserved"

      t.timestamps
    end

    add_index :items, :status
  end
end
