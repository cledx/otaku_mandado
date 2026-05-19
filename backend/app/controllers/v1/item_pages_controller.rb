# frozen_string_literal: true

module V1
  # Public item detail for the SPA item view (#item-{sale_id}-{item_id}).
  # Visible when the item is in the shop, in an active timed drop, ordered by the user, or admin.
  class ItemPagesController < ApplicationController
    include OptionalAuthentication

    def show
      sale = Sale.kept.find(params[:sale_id])
      item = sale.items.kept.find(params[:id])
      user = current_user_optional

      unless item.viewable_by?(user: user)
        render json: { error: "forbidden" }, status: :forbidden
        return
      end

      include_price = user&.role == "admin"
      render json: {
        data: {
          item: item.to_api_hash(include_price: include_price),
          sale: {
            id: sale.id,
            name: sale.name,
            shop: sale.shop?,
            active_now: Sale.active_now?(sale)
          },
          reservable: item.reservable_by?(user: user),
          ordered_by_current_user: ordered_by_user?(item, user)
        }
      }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "not_found" }, status: :not_found
    end

    private

    def ordered_by_user?(item, user)
      return false if user.blank?

      item.orders.kept.exists?(user_id: user.id)
    end
  end
end
