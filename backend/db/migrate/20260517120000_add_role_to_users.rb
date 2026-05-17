# frozen_string_literal: true

class AddRoleToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :role, :string, null: false, default: "client"
    add_index :users, :role
    add_check_constraint :users, "role IN ('admin', 'client')", name: "users_role_check"
  end
end
