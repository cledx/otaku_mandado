# frozen_string_literal: true

# Promotional code with an integer discount and an expiry datetime.
class CouponCode < ApplicationRecord
  include SoftDeletable

  has_many :orders, dependent: :restrict_with_error
end
