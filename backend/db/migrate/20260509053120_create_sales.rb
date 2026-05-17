# frozen_string_literal: true

# A sale is a timed drop: start_time (date) + duration (hours).
class CreateSales < ActiveRecord::Migration[8.1]
  def change
    create_table :sales do |t|
      t.string :name
      t.float :duration
      t.date :start_time

      t.timestamps
    end
  end
end
