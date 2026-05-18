# frozen_string_literal: true

# A sale is a timed drop: start_time (datetime) + duration (hours).
class CreateSales < ActiveRecord::Migration[8.1]
  def change
    create_table :sales do |t|
      t.string :name
      t.float :duration
      t.datetime :start_time

      t.timestamps
    end
  end
end
