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
  def to_api_hash
    {
      id: id,
      sale_id: sale_id,
      name: name,
      image: image,
      image_urls: image_urls,
      price: price,
      description: description,
      status: status,
      deleted_at: deleted_at,
      created_at: created_at,
      updated_at: updated_at
    }
  end

  private

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
