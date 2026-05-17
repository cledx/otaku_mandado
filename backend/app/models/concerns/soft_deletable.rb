# frozen_string_literal: true

# Sets deleted_at instead of destroying rows. Use +kept+ / +discarded+ scopes in queries.
module SoftDeletable
  extend ActiveSupport::Concern

  included do
    scope :kept, -> { where(deleted_at: nil) }
    scope :discarded, -> { where.not(deleted_at: nil) }
  end

  def discarded?
    deleted_at.present?
  end

  def kept?
    deleted_at.blank?
  end

  def soft_discard!
    return self if discarded?

    update!(deleted_at: Time.current)
    self
  end
end
