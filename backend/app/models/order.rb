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
  belongs_to :coupon_code, optional: true

  before_validation :assign_order_number, on: :create
  after_create :finalize_order_number
  after_create_commit :mark_item_reserved
  after_update_commit :free_item_if_discarded
  after_update_commit :credit_user_total_spent

  validates :status, inclusion: { in: STATUSES }
  validates :order_number, presence: true
  validate :no_duplicate_active_order_for_user_item, on: :create

  def to_api_hash(include_item: true, include_user: false)
    h = {
      id: id,
      user_id: user_id,
      item_id: item_id,
      status: status,
      order_number: order_number,
      deleted_at: deleted_at,
      created_at: created_at,
      updated_at: updated_at,
      coupon_code: coupon_code&.kept? ? coupon_code.to_api_hash : nil
    }
    h[:item] = item&.to_api_hash if include_item
    h[:user] = { id: user.id, email: user.email } if include_user && user

    h
  end

  private

  # Reserve the item the moment an order is placed so it can't be re-reserved.
  # Leaves "purchased" untouched; only flips "available" to "reserved".
  def mark_item_reserved
    return unless item&.status == "available"

    item.update_columns(status: "reserved", updated_at: Time.current)
  end

  # When an order is soft-discarded (admin cancels), release the item so someone
  # else can reserve it. Skip when the item was already sold or another kept
  # order still holds it. Mirrors mark_item_reserved (never touches "purchased").
  def free_item_if_discarded
    return unless saved_change_to_deleted_at?
    return if deleted_at.nil? # only on discard, not restore
    return unless item&.status == "reserved"
    return if item.orders.kept.exists?

    item.update_columns(status: "available", updated_at: Time.current)
  end

  # Credit this line's MXN cost to the user's running total the moment an
  # admin flips it to "payment fulfilled". Fires on every transition into
  # that status, so re-marking a previously-fulfilled line will re-credit;
  # that's the literal "whenever it's marked Payment Fulfilled" behavior.
  # update_all keeps the increment atomic across concurrent line updates
  # (the View Orders page can bulk-update an entire order in parallel).
  def credit_user_total_spent
    return unless saved_change_to_status?
    return unless status == "payment fulfilled"
    return if user_id.blank?

    amount = item&.mx_price.to_f
    return if amount.zero?

    User.where(id: user_id)
        .update_all(["total_spent = COALESCE(total_spent, 0) + ?", amount])
  end

  def no_duplicate_active_order_for_user_item
    return if user_id.blank? || item_id.blank?

    scope = self.class.kept.where(user_id: user_id, item_id: item_id)
    scope = scope.where.not(id: id) if id.present?
    if scope.exists?
      errors.add(:base, "You already have an order for this item")
    end
  end

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
