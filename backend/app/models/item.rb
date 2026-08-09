# frozen_string_literal: true

# Product listed under a sale. Images are Cloudinary public_ids stored in JSONB.
class Item < ApplicationRecord
  include SoftDeletable

  STATUSES = %w[reserved purchased available].freeze
  MAX_IMAGES = 2

  belongs_to :sale
  has_many :orders, dependent: :restrict_with_error

  validates :status, inclusion: { in: STATUSES }
  before_validation :normalize_image_public_ids
  before_save :sync_mx_price_from_price, if: :sync_mx_price_from_price?
  validate :validate_image_public_ids

  # `image` JSONB: up to 2 Cloudinary public_id strings, e.g. ["sale/abc", "sale/def"].
  # Hashes from upload widgets are normalized to strings before save.

  # Builds CDN URLs when Cloudinary is configured; otherwise returns raw public_ids.
  def image_urls(**options)
    cloudinary = defined?(Cloudinary) && Cloudinary.config.cloud_name.present?
    Array(image).filter_map do |public_id|
      next unless public_id.is_a?(String) && public_id.present?

      if cloudinary
        Cloudinary::Utils.cloudinary_url(public_id, **options)
      else
        public_id
      end
    end
  end

  # Stable JSON shape for v1 API responses.
  # Omit yen `price` on public sale pages; admins load it via authenticated sale#show.
  # Item detail page: static shop, live timed drop, user's order, or admin.
  def viewable_by?(user: nil)
    return true if user&.role == "admin"
    return true if sale.shop?
    return true if Sale.active_now?(sale)
    return false if user.blank?

    orders.kept.exists?(user_id: user.id)
  end

  def reservable_by?(user:)
    return false if user.blank?
    return false unless viewable_by?(user: user)
    return false unless sale.shop? || Sale.active_now?(sale)

    status == "available"
  end

  def to_api_hash(include_price: true)
    h = {
      id: id,
      sale_id: sale_id,
      name: name,
      brand: brand,
      image: image,
      image_urls: image_urls,
      mx_price: mx_price,
      description: description,
      status: status,
      deleted_at: deleted_at,
      created_at: created_at,
      updated_at: updated_at
    }
    h[:price] = price if include_price
    h
  end

  # Exact listing copy under the same sale, always starting as available.
  # Preserves yen/MX prices as-is (skips rate conversion on create).
  def duplicate_as_available!
    copy = self.class.new(
      sale_id: sale_id,
      name: name,
      brand: brand,
      description: description,
      price: price,
      mx_price: mx_price,
      image: Array(image).deep_dup,
      status: "available"
    )
    copy.instance_variable_set(:@skip_mx_price_sync, true)
    copy.save!
    copy
  end

  # Reassigns this item from a timed drop onto the permanent Shop catalog.
  def move_to_shop!
    raise AlreadyInShopError, "Item is already in the shop" if sale.shop?

    update!(sale: Sale.shop)
    self
  end

  class AlreadyInShopError < StandardError; end

  private

  def sync_mx_price_from_price?
    return false if @skip_mx_price_sync

    will_save_change_to_price?
  end

  def sync_mx_price_from_price
    if price.blank?
      self.mx_price = nil
      return
    end

    self.mx_price = Currency::JpyToMxnConverter.convert_yen(price)
  rescue Currency::JpyToMxnConverter::RateUnavailable => e
    errors.add(:price, "could not convert to Mexican pesos: #{e.message}")
    throw(:abort)
  end

  def normalize_image_public_ids
    return unless image.is_a?(Array)

    self.image =
      image.filter_map do |entry|
        case entry
        when String then entry.strip.presence
        when Hash then (entry["public_id"] || entry[:public_id]).to_s.presence
        end
      end.uniq
  end

  def validate_image_public_ids
    return if image.blank?

    unless image.is_a?(Array)
      errors.add(:image, "must be an array of Cloudinary public ids")
      return
    end

    errors.add(:image, "at most #{MAX_IMAGES} images allowed") if image.size > MAX_IMAGES

    image.each_with_index do |pid, idx|
      errors.add(:image, "entry #{idx} must be a non-blank public id") unless pid.is_a?(String) && pid.present?
    end
  end
end
