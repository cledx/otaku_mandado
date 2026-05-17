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

# This will be the persistent sale that is used for items that are not part of a sale and always available.
store = Sale.find_or_initialize_by(name: "Store")


[
  ["admin@example.com", "admin"],
  ["client@example.com", "client"],
].each do |email, role|
  user = User.find_or_initialize_by(email: email)
  user.password = "password" if user.new_record?
  user.role = role
  user.save!
end