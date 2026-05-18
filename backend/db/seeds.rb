# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Fixture sale for local AI/item upload testing (see ProcessImageMetadataService).

Sale.destroy_all
Item.destroy_all

sale = Sale.new(name: "Seed Sale")
sale.start_time = 2.days.from_now.to_date
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
    status: Item::STATUSES.sample
  )
end

# This will be the persistent sale that is used for items that are not part of a sale and always available.
shop = Sale.find_or_initialize_by(name: Sale::SHOP_NAME)
shop.save! if shop.new_record?


[
  ["admin@example.com", "admin"],
  ["client@example.com", "client"],
].each do |email, role|
  user = User.find_or_initialize_by(email: email)
  user.password = "password" if user.new_record?
  user.role = role
  user.save!
end