# frozen_string_literal: true

# Timed product drop (mandado). Discarding a sale soft-deletes its items.
class Sale < ApplicationRecord
  include SoftDeletable

  SHOP_NAME = "Shop"

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

  # before | during | after — drives countdown UI on landing and sale pages.
  def phase_at(time = Time.current)
    sa = starts_at
    ea = ends_at
    return nil unless sa && ea

    if time < sa
      "before"
    elsif time < ea
      "during"
    else
      "after"
    end
  end

  def self.shop
    kept.find_by!(name: SHOP_NAME)
  end

  # Public drop page JSON (items + optional countdown timing).
  def sale_page_data(include_price: false, time: Time.current)
    timing_payload(time).merge(sale: to_api_hash(include_items: true, include_price: include_price))
  end

  # Shared JSON timing block for landing_sale and sale_pages API responses.
  def timing_payload(time = Time.current)
    sa = starts_at
    ea = ends_at
    {
      phase: phase_at(time),
      starts_at: sa&.iso8601(3),
      ends_at: ea&.iso8601(3)
    }
  end

  # Resolves which sale backs the navbar "Current Sale" link for the given role.
  def self.current_for_nav(role)
    predicate = role == "admin" ? :admin_current_nav? : :client_current_nav?
    timed_drops.order(:start_time, :id).find { |sale| public_send(predicate, sale) }
  end

  def self.ongoing
    timed_drops.order(:start_time, :id).find { |sale| active_now?(sale) }
  end

  def self.next_scheduled
    timed_drops.order(:start_time, :id).find do |sale|
      sa = sale.starts_at
      sa && sa > Time.current
    end
  end

  def self.active_now?(sale)
    sa = sale.starts_at
    ea = sale.ends_at
    sa && ea && Time.current >= sa && Time.current < ea
  end

  def self.client_current_nav?(sale)
    sa = sale.starts_at
    ea = sale.ends_at
    return false unless sa && ea

    now = Time.current
    now >= sa - 1.hour && now < ea
  end

  def self.admin_current_nav?(sale)
    sa = sale.starts_at
    ea = sale.ends_at
    return false unless sa && ea

    now = Time.current
    now >= sa - 1.hour && now <= ea + 1.hour
  end

  # Prefer the in-progress drop; otherwise the first sale whose start is after (now - 5 hours).
  def self.timed_drops
    kept.where.not(name: SHOP_NAME)
  end

  def self.next_for_landing
    sales = timed_drops.order(:start_time, :id).to_a
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

  def to_api_hash(include_items: false, include_price: true)
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
      h[:items] = items.kept.order(:id).map { |item| item.to_api_hash(include_price: include_price) }
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
