# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :jti, :string, null: false, default: "" unless column_exists?(:users, :jti)
    add_index :users, :jti, unique: true unless index_exists?(:users, :jti)
  end
end
