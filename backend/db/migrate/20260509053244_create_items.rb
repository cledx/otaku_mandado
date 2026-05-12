class CreateItems < ActiveRecord::Migration[8.1]
  def change
    create_table :items do |t|
      t.integer :price
      t.string :name
      t.string :brand
      t.boolean :is_reserved
      t.boolean :payment_processed
      t.string :is_collected

      t.timestamps
    end
  end
end
