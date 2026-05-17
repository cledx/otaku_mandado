# frozen_string_literal: true

# Users table for Devise + devise-jwt (jti used for token revocation).
class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.datetime :remember_created_at
      t.string :jti, null: false, default: ""

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :jti, unique: true
  end
end
