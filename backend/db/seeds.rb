# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Fixture sale for local AI/item upload testing (see ProcessImageMetadataService).

Order.delete_all
Item.delete_all
Sale.delete_all

sale = Sale.new(name: "Seed Sale")
sale.start_time = 2.days.from_now.change(hour: 12, min: 0)
sale.duration = 3.0 # interpreted as hours in product copy; adjust if your app uses another unit
sale.save!

SEED_ITEM_IMAGE = "elementor-placeholder-image_ms9kvy"
SEED_ITEM_DESCRIPTION = <<~TEXT.squish
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
TEXT

45.times do |i|
  sale.items.create!(
    name: "Item #{i + 1}",
    brand: "Brand Name",
    description: SEED_ITEM_DESCRIPTION,
    price: 1000 + (i % 41) * 100,
    image: [SEED_ITEM_IMAGE],
    status: "available"
  )
end

[
  ["admin@example.com", "admin123"],
  ["client1@example.com", "client"],
  ["client2@example.com", "client"],
  ["client3@example.com", "client"]
].each do |email, role|
  user = User.find_or_initialize_by(email: email)
  user.password = "password" if user.new_record?
  user.role = role
  user.save!
end

# Persistent catalog (Browse Shop); items appear on the landing-page carousel.
shop = Sale.find_or_initialize_by(name: Sale::SHOP_NAME)
shop.save! if shop.new_record?

client_users = User.where(role: "client").to_a

12.times do |i|
  target_status = Item::STATUSES.sample

  item = shop.items.create!(
    name: "Shop Item #{i + 1}",
    brand: "Brand Name",
    description: SEED_ITEM_DESCRIPTION,
    price: 2500 + (i % 17) * 150,
    image: [SEED_ITEM_IMAGE],
    status: "available"
  )

  next if target_status == "available" || client_users.empty?

  # Non-available shop items belong to a random client via a random order.
  # Order's after_create_commit flips the item from "available" to "reserved";
  # bump it to "purchased" afterwards when that's the intended final state.
  Order.create!(user: client_users.sample, item: item, status: "pending")
  item.update_columns(status: "purchased", updated_at: Time.current) if target_status == "purchased"
end