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

ActiveRecord::Schema[8.1].define(version: 2026_05_12_180000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "containers", force: :cascade do |t|
    t.text "content"
    t.jsonb "coordinate", null: false
    t.datetime "created_at", null: false
    t.string "descriptor", null: false
    t.jsonb "dimensions", null: false
    t.bigint "parent_id"
    t.datetime "updated_at", null: false
    t.bigint "worksheet_id", null: false
    t.index ["parent_id"], name: "index_containers_on_parent_id"
    t.index ["worksheet_id"], name: "index_containers_on_worksheet_id"
  end

  create_table "items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.text "description"
    t.jsonb "image", default: [], null: false
    t.string "name"
    t.float "price"
    t.bigint "sale_id", null: false
    t.string "status", default: "reserved", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_items_on_deleted_at"
    t.index ["sale_id"], name: "index_items_on_sale_id"
    t.index ["status"], name: "index_items_on_status"
  end

  create_table "jwt_denylists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "exp"
    t.string "jti"
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_jwt_denylists_on_jti", unique: true
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

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone_number"
    t.datetime "updated_at", null: false
  end

  create_table "sales", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.float "duration"
    t.string "name"
    t.date "start_time"
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_sales_on_deleted_at"
  end

  create_table "user_worksheets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "worksheet_id", null: false
    t.index ["user_id", "worksheet_id"], name: "index_user_worksheets_on_user_id_and_worksheet_id", unique: true
    t.index ["user_id"], name: "index_user_worksheets_on_user_id"
    t.index ["worksheet_id"], name: "index_user_worksheets_on_worksheet_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "allow_password_change", default: false
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", default: "", null: false
    t.bigint "organization_id"
    t.string "provider", default: "email", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "teacher", null: false
    t.json "tokens"
    t.string "uid", default: "", null: false
    t.string "unconfirmed_email"
    t.datetime "updated_at", null: false
    t.text "worksheet_prompt"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["organization_id"], name: "index_users_on_organization_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["uid", "provider"], name: "index_users_on_uid_and_provider", unique: true
  end

  create_table "worksheets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_private", default: false, null: false
    t.boolean "is_template", default: false, null: false
    t.string "level"
    t.text "pdf_error"
    t.string "pdf_status", default: "pending", null: false
    t.string "subject"
    t.string "tags", default: [], array: true
    t.string "title"
    t.string "topic"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.string "worksheet_type"
    t.index ["pdf_status"], name: "index_worksheets_on_pdf_status"
    t.index ["user_id"], name: "index_worksheets_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "containers", "containers", column: "parent_id"
  add_foreign_key "containers", "worksheets"
  add_foreign_key "items", "sales"
  add_foreign_key "orders", "items"
  add_foreign_key "orders", "users"
  add_foreign_key "user_worksheets", "users"
  add_foreign_key "user_worksheets", "worksheets"
  add_foreign_key "users", "organizations"
  add_foreign_key "worksheets", "users", on_delete: :nullify
end
