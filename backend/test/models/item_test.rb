# frozen_string_literal: true

require "test_helper"

class ItemTest < ActiveSupport::TestCase
  setup do
    @sale = Sale.create!(name: "Test Sale", start_time: Date.current, duration: 1.0)
  end

  test "sets mx_price when price is assigned on create" do
    with_stubbed_jpy_to_mxn(->(_amount, **) { 120 }) do
      item = @sale.items.create!(name: "Figure", price: 1000, status: "available", image: [])
      assert_equal 120, item.mx_price
    end
  end

  test "updates mx_price when price changes" do
    item = @sale.items.create!(name: "Figure", status: "available", image: [])

    with_stubbed_jpy_to_mxn(->(_amount, **) { 120 }) do
      item.update!(price: 1000)
      assert_equal 120, item.mx_price
    end

    with_stubbed_jpy_to_mxn(->(_amount, **) { 250 }) do
      item.update!(price: 2000)
      assert_equal 250, item.mx_price
    end
  end

  test "clears mx_price when price is cleared" do
    item = @sale.items.create!(name: "Figure", status: "available", image: [])

    with_stubbed_jpy_to_mxn(->(_amount, **) { 120 }) do
      item.update!(price: 1000)
    end

    item.update!(price: nil)
    assert_nil item.mx_price
  end

  test "aborts save when conversion fails" do
    with_stubbed_jpy_to_mxn(->(_amount, **) { raise Currency::JpyToMxnConverter::RateUnavailable, "offline" }) do
      item = @sale.items.build(name: "Figure", price: 1000, status: "available", image: [])
      assert_not item.save
      assert_includes item.errors[:price], "could not convert to Mexican pesos: offline"
    end
  end
end
