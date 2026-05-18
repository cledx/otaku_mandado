# frozen_string_literal: true

module V1
  # Public read for the persistent "Shop" catalog (Browse Shop navbar link).
  class ShopSalesController < ApplicationController
    def show
      sale = Sale.shop
      render json: { data: sale.sale_page_data(include_price: false) }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "not_found" }, status: :not_found
    end
  end
end
