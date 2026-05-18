# frozen_string_literal: true

class ChangeSalesStartTimeToDatetime < ActiveRecord::Migration[8.1]
  def up
    change_column :sales, :start_time, :datetime
  end

  def down
    change_column :sales, :start_time, :date
  end
end
