# frozen_string_literal: true

# Timed product drop (mandado). Discarding a sale soft-deletes its items.
class Sale < ApplicationRecord
  include SoftDeletable

  has_many :items, dependent: :destroy

  after_update :discard_items_when_sale_discarded, if: :saved_change_to_deleted_at?

  # Calendar day start in Time.zone; duration is hours (see db/seeds.rb).
  def starts_at
    return if start_time.blank?

    start_time.in_time_zone(Time.zone).beginning_of_day
  end

  def ends_at
    return if starts_at.blank? || duration.blank?

    starts_at + duration.to_f.hours
  end

  # Prefer the in-progress drop; otherwise the first sale whose start is after (now - 5 hours).
  def self.next_for_landing
    sales = kept.order(:start_time, :id).to_a
    active = sales.find do |sale|
      sa = sale.starts_at
      ea = sale.ends_at
      sa && ea && Time.current >= sa && Time.current < ea
    end
    return active if active

    threshold = 5.hours.ago
    sales.find do |sale|
      sa = sale.starts_at
      sa && sa > threshold
    end
  end

  def to_api_hash(include_items: false)
    h = {
      id: id,
      start_time: start_time,
      duration: duration,
      name: name,
      deleted_at: deleted_at,
      created_at: created_at,
      updated_at: updated_at
    }
    if include_items
      h[:items] = items.order(:id).map(&:to_api_hash)
    end
    h
  end

  private

  # Cascade soft delete to items when the sale is discarded.
  def discard_items_when_sale_discarded
    previous, current = saved_change_to_deleted_at
    return unless previous.nil? && current.present?

    items.kept.find_each(&:soft_discard!)
  end
end
