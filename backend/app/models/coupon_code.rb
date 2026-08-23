# frozen_string_literal: true

# Promotional code with an integer percent discount and an expiry datetime.
class CouponCode < ApplicationRecord
  include SoftDeletable

  has_many :orders, dependent: :restrict_with_error

  before_validation :normalize_code

  validates :code, presence: true, uniqueness: { case_sensitive: false }
  validates :discount, presence: true,
                       numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 100 }
  validates :expiry, presence: true

  def to_api_hash
    {
      id: id,
      code: code,
      discount: discount,
      expiry: expiry&.iso8601,
      created_at: created_at&.iso8601
    }
  end

  private

  def normalize_code
    self.code = code.to_s.strip.upcase.presence
  end
end
