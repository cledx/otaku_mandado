# frozen_string_literal: true

# Promotional codes: a unique string, integer discount, and expiry datetime (same as sales.start_time).
class CreateCouponCodes < ActiveRecord::Migration[8.1]
  def change
    create_table :coupon_codes do |t|
      t.string :code
      t.integer :discount
      t.datetime :expiry
      t.datetime :deleted_at

      t.timestamps
    end

    add_index :coupon_codes, :code, unique: true
    add_index :coupon_codes, :deleted_at
  end
end
