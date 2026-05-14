# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

SEED_SALE_NAME = "[seed] ProcessImageMetadataService fixture sale".freeze

sale = Sale.find_or_initialize_by(name: SEED_SALE_NAME)
sale.start_time = 2.days.from_now.to_date
sale.duration = 3.0 # interpreted as hours in product copy; adjust if your app uses another unit
sale.save!

# Recreate items so re-running db:seed keeps the same two Cloudinary fixtures.
sale.items.destroy_all

Item.create!(
  sale: sale,
  name: "",
  description: "",
  price: nil,
  status: "available",
  image: ["test_image_figure_2_ikos7z"]
)

Item.create!(
  sale: sale,
  name: "",
  description: "",
  price: nil,
  status: "available",
  image: ["test_image_figure_1_yyskid"]
)
