# frozen_string_literal: true

require "test_helper"

class OrderTest < ActiveSupport::TestCase
  setup do
    @sale = Sale.create!(name: "Spend Tracker Sale", start_time: Time.current, duration: 1.0)
    @user = User.create!(email: "spender@example.com", password: "password", role: "client")
  end

  test "crediting user.total_spent when an order flips to payment fulfilled" do
    item = build_item(mx_price: 250.0)
    order = @user.orders.create!(item: item, status: "pending")

    assert_difference -> { @user.reload.total_spent }, 250.0 do
      order.update!(status: "payment fulfilled")
    end
  end

  test "does not credit when status changes between non-fulfilled states" do
    item = build_item(mx_price: 250.0)
    order = @user.orders.create!(item: item, status: "pending")
    order.update!(status: "payment fulfilled") # initial credit
    @user.reload

    assert_no_difference -> { @user.reload.total_spent } do
      order.update!(status: "items purchased")
    end
  end

  test "is a no-op when the item has no mx_price" do
    item = build_item(mx_price: nil)
    order = @user.orders.create!(item: item, status: "pending")

    assert_no_difference -> { @user.reload.total_spent } do
      order.update!(status: "payment fulfilled")
    end
  end

  private

  def build_item(mx_price:)
    @sale.items.create!(
      name: "Figure",
      status: "available",
      image: [],
      mx_price: mx_price
    )
  end
end
