# frozen_string_literal: true

# Orders may optionally reference one coupon; a coupon can apply to many orders.
class AddCouponCodeToOrders < ActiveRecord::Migration[8.1]
  def change
    add_reference :orders, :coupon_code, null: true, foreign_key: true
  end
end
