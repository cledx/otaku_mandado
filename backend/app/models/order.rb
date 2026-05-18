# frozen_string_literal: true

# Client purchase intent for an item. Pending orders for the same user share one order_number.
class Order < ApplicationRecord
  include SoftDeletable

  # Fulfillment pipeline statuses (Spanish product copy may mirror these in the UI).
  STATUSES = [
    "pending",
    "payment fulfilled",
    "items purchased",
    "items sent",
    "items received"
  ]

  belongs_to :user
  belongs_to :item

  before_validation :assign_order_number, on: :create
  after_create :finalize_order_number

  validates :status, inclusion: { in: STATUSES }
  validates :order_number, presence: true

  def to_api_hash(include_item: true)
    h = {
      id: id,
      user_id: user_id,
      item_id: item_id,
      status: status,
      order_number: order_number,
      deleted_at: deleted_at,
      created_at: created_at,
      updated_at: updated_at
    }
    h[:item] = item&.to_api_hash if include_item

    h
  end

  private

  # TMP-* placeholder until after_create; then replaced with ORD-{date}-{user_id}-{id}.
  # Reuses an existing pending order_number so one checkout groups multiple line items.
  def assign_order_number
    return if order_number.present?

    shared = existing_pending_order_for_user
    if shared && !shared.order_number.start_with?("TMP-")
      self.order_number = shared.order_number
      return
    end

    loop do
      candidate = "TMP-#{SecureRandom.alphanumeric(16)}"
      next if self.class.unscoped.exists?(order_number: candidate)

      self.order_number = candidate
      break
    end
  end

  def finalize_order_number
    return unless order_number&.start_with?("TMP-")

    update_column(:order_number, computed_order_number)
  end

  def existing_pending_order_for_user
    return if user_id.blank?

    scope = self.class.kept.where(user_id: user_id, status: "pending")
    scope = scope.where.not(id: id) if id.present?
    scope.order(:created_at).first
  end

  def computed_order_number
    "ORD-#{order_date_segment}-#{user_id}-#{id}"
  end

  # ddmmyy from the item's sale start (or sale/item created_at fallback).
  def order_date_segment
    date =
      if item&.sale
        s = item.sale
        if s.start_time.present?
          s.start_time.in_time_zone.to_date
        else
          s.created_at.in_time_zone.to_date
        end
      else
        created_at.in_time_zone.to_date
      end
    date.strftime("%d%m%y")
  end
end
