# frozen_string_literal: true

class Sale < ApplicationRecord
  include SoftDeletable

  has_many :items, dependent: :destroy

  after_update :discard_items_when_sale_discarded, if: :saved_change_to_deleted_at?

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

  def discard_items_when_sale_discarded
    previous, current = saved_change_to_deleted_at
    return unless previous.nil? && current.present?

    items.kept.find_each(&:soft_discard!)
  end
end
