# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_05_19_090000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "items", force: :cascade do |t|
    t.string "brand"
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.jsonb "image", default: [], null: false
    t.float "mx_price"
    t.string "name"
    t.float "price"
    t.bigint "sale_id", null: false
    t.string "status", default: "reserved", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_items_on_deleted_at"
    t.index ["sale_id"], name: "index_items_on_sale_id"
    t.index ["status"], name: "index_items_on_status"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.bigint "item_id", null: false
    t.string "order_number", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["deleted_at"], name: "index_orders_on_deleted_at"
    t.index ["item_id"], name: "index_orders_on_item_id"
    t.index ["order_number"], name: "index_orders_on_order_number"
    t.index ["status"], name: "index_orders_on_status"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "sales", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.float "duration"
    t.string "name"
    t.datetime "start_time"
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_sales_on_deleted_at"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", default: "", null: false
    t.datetime "remember_created_at"
    t.string "role", default: "client", null: false
    t.float "total_spent", default: 0.0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.check_constraint "role::text = ANY (ARRAY['admin'::character varying, 'client'::character varying]::text[])", name: "users_role_check"
  end

  add_foreign_key "items", "sales"
  add_foreign_key "orders", "items"
  add_foreign_key "orders", "users"
end
