# frozen_string_literal: true

require "test_helper"

class ItemTest < ActiveSupport::TestCase
  setup do
    @sale = Sale.create!(name: "Test Sale", start_time: Time.current, duration: 1.0)
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

  test "duplicate_as_available! copies listing fields and forces available status" do
    item = nil
    with_stubbed_jpy_to_mxn(->(_amount, **) { 150 }) do
      item = @sale.items.create!(
        name: "Figure",
        brand: "Good Smile",
        description: "Nendoroid",
        price: 1000,
        status: "purchased",
        image: ["sale/front", "sale/back"]
      )
    end

    copy = item.duplicate_as_available!

    assert_not_equal item.id, copy.id
    assert_equal item.sale_id, copy.sale_id
    assert_equal "Figure", copy.name
    assert_equal "Good Smile", copy.brand
    assert_equal "Nendoroid", copy.description
    assert_equal 1000, copy.price
    assert_equal 150, copy.mx_price
    assert_equal ["sale/front", "sale/back"], copy.image
    assert_equal "available", copy.status
    assert_equal "purchased", item.reload.status
  end

  test "move_to_shop! reassigns item onto the Shop sale" do
    shop = Sale.create!(name: Sale::SHOP_NAME)
    item = @sale.items.create!(name: "Figure", status: "available", image: [])

    item.move_to_shop!

    assert_equal shop.id, item.reload.sale_id
  end

  test "move_to_shop! raises when item is already in the shop" do
    shop = Sale.create!(name: Sale::SHOP_NAME)
    item = shop.items.create!(name: "Figure", status: "available", image: [])

    assert_raises(Item::AlreadyInShopError) { item.move_to_shop! }
  end
end
